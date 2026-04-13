import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { normalizeCohortCheckinFields } from "@/lib/cohortCheckinFields";
import {
  cohortUsesStoreCreditPartnerReward,
  storeCreditTitleFromCohortRow,
} from "@/lib/cohortStudyLandingRewards";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  countCohortBaselineCheckinDistinctDaysForUserIds,
  countDistinctDailyEntriesSinceForUserIds,
  consecutiveCheckinStreakFromYmds,
  daysBetweenInclusiveUtcYmd,
  fetchCohortBaselineCheckinYmdsForUserIds,
  fetchCohortCheckinYmdsSinceEnrollForUserIds,
} from "@/lib/cohortCheckinCount";
import { cohortParticipantUserIdCandidatesSync } from "@/lib/cohortParticipantUserId";
import {
  needsCohortStudyStackRepair,
  pickPrimaryProfileIdByStackCount,
  runCohortMainProductHandoffCleanup,
} from "@/lib/cohortEnrollment";
import { shouldUseCohortCheckinBranch } from "@/lib/cohortCheckinBranch";
import { resolveCohortDashboardParticipantUi } from "@/lib/cohortDashboardParticipantUi";
import { parseStudyStartPending } from "@/lib/cohortStudyStartPending";

export const dynamic = "force-dynamic";

/** First name for UI: optional first_name / full_name on row if present; else first token of display_name (production profiles use display_name only). */
function profileWelcomeFirstNameFromRow(prof: unknown): string | null {
  if (!prof || typeof prof !== "object") return null;
  const p = prof as Record<string, unknown>;
  const fn = p.first_name;
  if (fn != null && String(fn).trim() !== "") return String(fn).trim();
  const full = p.full_name;
  if (full != null && String(full).trim() !== "") {
    const w = String(full).trim().split(/\s+/)[0];
    return w || null;
  }
  const disp = p.display_name;
  if (disp != null && String(disp).trim() !== "") {
    const w = String(disp).trim().split(/\s+/)[0];
    return w || null;
  }
  return null;
}

/** Browser local calendar day from dashboard load (?localToday=YYYY-MM-DD); else UTC date (legacy callers). */
function todayYmdForCohort(request: Request): string {
  try {
    const p = new URL(request.url).searchParams.get("localToday")?.trim();
    if (p && /^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
  } catch {}
  return new Date().toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    let firstName: string | null = null;
    let email: string | null = null;
    let userId: string | null = null;
    let tier: string | null = null;
    let pro_expires_at: string | null = null;
    let cohortId: string | null = null;
    let checkinFields: string[] | null = null;
    let cohortCheckinWelcomeRecommended = false;
    let cohortStudyProductName: string | null = null;
    let cohortCheckinCount = 0;
    let cohortStartDate: string | null = null;
    let cohortStudyDays = 0;
    let cohortCurrentStreak = 0;
    let cohortStudyEndDate: string | null = null;
    let cohortStudyIsActive = false;
    let cohortHasCheckedInToday = false;
    let cohortStudyBrandName: string | null = null;
    let cohortStudyCurrentDay = 0;
    let cohortDaysRemaining = 0;
    let cohortStudyComplete = false;
    let cohortConfirmed = false;
    let cohortComplianceDeadlineIso: string | null = null;
    let cohortAwaitingStudyStart = false;
    let cohortStudyStartedAtIso: string | null = null;
    /** Set when cron marks study complete (DB); overrides day-count preview. */
    let cohortStudyPersistedComplete = false;
    let cohortParticipantResultPublished = false;
    let profileWelcomeFirstName: string | null = null;
    /** True when this user should see the cohort study dashboard (/dashboard), not the B2C stack dashboard. */
    let showCohortStudyDashboard = false;
    /** True when cohort_participants.status is `dropped` — cohort terminal state only (not B2C product). */
    let cohortParticipantDropped = false;
    /** Set when we load cohort_participants (debug / logging); null if not in cohort participant path. */
    let cohortParticipantStatus: string | null = null;
    /** Partner completion incentive is store credit (vs product supply) — from `study_landing_reward_config`. */
    let cohortCompletionRewardStoreCredit = false;
    let cohortStoreCreditTitle: string | null = null;
    /** Matches POST /api/checkin cohort path (`shouldUseCohortCheckinBranch`) — use for check-in modal UI. */
    let cohortCheckinBranch = false;
    /** DB `cohort_participants.confirmed_at` (ISO) when loaded — UI uses local calendar vs this for confirmation-day hero. */
    let cohortParticipantConfirmedAtIso: string | null = null;
    /** DB `cohort_participants.product_arrived_at` (DATE as YYYY-MM-DD) when set — cohort check-in modal subtitle. */
    let cohortParticipantProductArrivedAt: string | null = null;
    /** True when `study_start_pending` holds a valid payload (product-arrival flow done; clock applies on first check-in). */
    let cohortStudyStartPending = false;

    if (!authError && user) {
      email = user.email || null;
      userId = user.id;
    } else {
      try {
        const all = (await cookies()).getAll();
        const tokenCookie = all.find(
          (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"),
        );
        if (tokenCookie?.value) {
          const parsed = JSON.parse(tokenCookie.value);
          email = parsed?.user?.email || parsed?.email || null;
          userId = parsed?.user?.id || parsed?.user?.sub || null;
        }
      } catch {}
      if (!email) {
        try {
          const hdr = request.headers.get("x-supabase-auth");
          if (hdr) {
            const parsed = JSON.parse(hdr);
            email = parsed?.user?.email || parsed?.email || null;
            userId = parsed?.user?.id || parsed?.user?.sub || null;
          }
        } catch {}
      }
      if (!email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    try {
      if (userId) {
        /*
         * public.profiles — only .select() columns that exist in the target DB; PostgREST errors on
         * unknown columns and breaks /api/me (including cohortId).
         *
         * Confirmed columns: id, user_id, cohort_id, display_name, tier, pro_expires_at,
         * first_name (20260416120000_profiles_first_name.sql).
         * Do not select full_name — it does not exist.
         */
        const {
          data: prof,
          error: profSelectErr,
        } = await supabase
          .from("profiles")
          .select("id, cohort_id, display_name, tier, pro_expires_at")
          .eq("user_id", userId)
          .maybeSingle();
        // TEMP: remove after cohortId null investigation (check server logs, not browser).
        console.log("[api/me] profiles select raw (user Supabase client)", {
          userId,
          selectError: profSelectErr?.message ?? null,
          selectErrorCode: profSelectErr?.code ?? null,
          cohort_id:
            prof && typeof prof === "object"
              ? (prof as { cohort_id?: unknown }).cohort_id
              : null,
          rawProf: prof,
        });
        profileWelcomeFirstName = profileWelcomeFirstNameFromRow(prof);
        const fromProfiles =
          profileWelcomeFirstName ||
          (prof as any)?.display_name ||
          ((prof as any)?.full_name
            ? String((prof as any)?.full_name).split(" ")[0]
            : null);
        if (fromProfiles) firstName = String(fromProfiles);
        tier = (prof as any)?.tier ?? null;
        pro_expires_at = (prof as any)?.pro_expires_at ?? null;

        // Cohort: use service role so RLS never hides cohort_id / participant rows from the app.
        // Do not wrap in one broad try/catch — a failure in a downstream query must not wipe cohortId.
        try {
          const { data: pAdmin, error: pAdminErr } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, cohort_id, display_name, cohort_study_stack_cleaned_at",
            )
            .eq("user_id", userId)
            .maybeSingle();
          if (pAdminErr) {
            console.error(
              "[api/me] supabaseAdmin profiles read:",
              pAdminErr.message,
            );
          }
          if (!profileWelcomeFirstName && pAdmin) {
            profileWelcomeFirstName =
              profileWelcomeFirstNameFromRow(pAdmin);
          }
          const rawC = (pAdmin as { cohort_id?: string | null } | null)
            ?.cohort_id;
          cohortId =
            rawC != null && String(rawC).trim() !== ""
              ? String(rawC).trim()
              : null;
          let profileId = (pAdmin as { id?: string } | null)?.id
            ? String((pAdmin as { id: string }).id)
            : null;

          if (
            (cohortId == null || cohortId === "") &&
            prof &&
            typeof prof === "object"
          ) {
            const rawProfC = (prof as { cohort_id?: unknown }).cohort_id;
            if (rawProfC != null && String(rawProfC).trim() !== "") {
              cohortId = String(rawProfC).trim();
            }
          }
          if (
            (profileId == null || profileId === "") &&
            prof &&
            typeof prof === "object"
          ) {
            const rawId = (prof as { id?: unknown }).id;
            if (rawId != null && String(rawId).trim() !== "") {
              profileId = String(rawId).trim();
            }
          }

          // Align with /api/progress/loop: cohort stack + handoff cleanup must target the same profile
          // when duplicate profile rows exist (maybeSingle() is ambiguous or fails).
          if (cohortId && userId) {
            const picked = await pickPrimaryProfileIdByStackCount(userId as string);
            if (picked) profileId = picked;
          }

          // Cohort row (checkin_fields, study copy) must load whenever cohortId exists. Do not gate on
          // profileId — profile id can be missing while cohort_id (slug) is still set; cohortCheckinBranch
          // only needs cohortId + userId, which produced checkinFields: null + branch true before this fix.
          if (cohortId) {
            const todayYmd = todayYmdForCohort(request);
            const cohortLookupKey = String(cohortId).trim();
            const cohortSelect =
              "id, slug, checkin_fields, product_name, brand_name, study_days, start_date, end_date, study_landing_reward_config";
            let { data: cdef, error: cdefErr } = await supabaseAdmin
              .from("cohorts")
              .select(cohortSelect)
              .eq("slug", cohortLookupKey)
              .maybeSingle();
            const uuidLike =
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                cohortLookupKey,
              );
            if (cdef == null && cdefErr == null && uuidLike) {
              const r2 = await supabaseAdmin
                .from("cohorts")
                .select(cohortSelect)
                .eq("id", cohortLookupKey)
                .maybeSingle();
              cdef = r2.data;
              cdefErr = r2.error;
            }
            if (cdefErr) {
              console.error(
                "[api/me] cohorts lookup:",
                cohortLookupKey,
                cdefErr.message,
              );
            }
            console.log("[api/me] cohort lookup", {
              cohortId: cohortLookupKey,
              cdef,
              rawCheckinFields: (cdef as { checkin_fields?: unknown } | null)
                ?.checkin_fields,
            });
            if (cdef != null) {
              const canonicalSlug = (cdef as { slug?: string | null })?.slug;
              if (
                canonicalSlug != null &&
                String(canonicalSlug).trim() !== ""
              ) {
                cohortId = String(canonicalSlug).trim();
              }
              checkinFields = normalizeCohortCheckinFields(
                (cdef as { checkin_fields?: unknown }).checkin_fields,
              );
              showCohortStudyDashboard = true;
              cohortCompletionRewardStoreCredit = cohortUsesStoreCreditPartnerReward(
                cdef as {
                  study_landing_reward_config?: unknown;
                  checkin_fields?: unknown;
                },
              );
              cohortStoreCreditTitle = storeCreditTitleFromCohortRow(
                cdef as {
                  study_landing_reward_config?: unknown;
                  checkin_fields?: unknown;
                },
              );
              const pn = (cdef as { product_name?: string | null } | null)
                ?.product_name;
              cohortStudyProductName =
                pn != null && String(pn).trim() !== ""
                  ? String(pn).trim()
                  : null;
              const bn = (cdef as { brand_name?: string | null } | null)
                ?.brand_name;
              cohortStudyBrandName =
                bn != null && String(bn).trim() !== ""
                  ? String(bn).trim()
                  : null;
              const sd = (cdef as { study_days?: number | null } | null)
                ?.study_days;
              cohortStudyDays = typeof sd === "number" && sd > 0 ? sd : 21;
              const endRaw = (cdef as { end_date?: string | null } | null)
                ?.end_date;
              cohortStudyEndDate =
                endRaw != null && String(endRaw).trim() !== ""
                  ? String(endRaw).slice(0, 10)
                  : null;
              cohortStudyIsActive =
                !cohortStudyEndDate || cohortStudyEndDate >= todayYmd;

              const cohortUuid = (cdef as { id?: string } | null)?.id;
              const cohortStart = (
                cdef as { start_date?: string | null } | null
              )?.start_date;
              if (cohortUuid) {
                try {
                  const cpUserIds = cohortParticipantUserIdCandidatesSync(
                    profileId ?? "",
                    userId,
                  );
                  const { data: part, error: partErr } = await supabaseAdmin
                    .from("cohort_participants")
                    .select(
                      "enrolled_at, confirmed_at, study_started_at, study_completed_at, status, product_arrived_at, study_start_pending",
                    )
                    .in("user_id", cpUserIds)
                    .eq("cohort_id", cohortUuid)
                    .maybeSingle();
                  if (partErr) {
                    console.error(
                      "[api/me] cohort_participants read:",
                      partErr.message,
                    );
                    cohortParticipantStatus = `(participant query error: ${partErr.message})`;
                  }
                  const enrolledAt = (part as { enrolled_at?: string } | null)
                    ?.enrolled_at;
                  const confirmedAtRaw = (
                    part as { confirmed_at?: string | null } | null
                  )?.confirmed_at;
                  cohortParticipantConfirmedAtIso =
                    confirmedAtRaw != null &&
                    String(confirmedAtRaw).trim() !== ""
                      ? String(confirmedAtRaw).trim()
                      : null;
                  const participantStatus = String(
                    (part as { status?: string | null } | null)?.status || "",
                  )
                    .trim()
                    .toLowerCase();
                  if (!partErr) {
                    cohortParticipantStatus = part
                      ? participantStatus || "(status empty)"
                      : "(no participant row)";
                  }
                  if (participantStatus === "dropped") {
                    showCohortStudyDashboard = false;
                    cohortParticipantDropped = true;
                  } else if (
                    participantStatus &&
                    !["applied", "confirmed", "completed"].includes(
                      participantStatus,
                    )
                  ) {
                    showCohortStudyDashboard = false;
                  }
                  const studyStartedRaw = (
                    part as { study_started_at?: string | null } | null
                  )?.study_started_at;
                  const studyStartedAtIso =
                    studyStartedRaw != null &&
                    String(studyStartedRaw).trim() !== ""
                      ? String(studyStartedRaw).trim()
                      : null;
                  cohortStudyStartedAtIso = studyStartedAtIso;
                  const studyCompletedRaw = (
                    part as { study_completed_at?: string | null } | null
                  )?.study_completed_at;
                  const productArrivedAtRaw = (
                    part as { product_arrived_at?: string | null } | null
                  )?.product_arrived_at;
                  {
                    const y =
                      productArrivedAtRaw != null &&
                      String(productArrivedAtRaw).trim() !== ""
                        ? String(productArrivedAtRaw).trim().slice(0, 10)
                        : "";
                    cohortParticipantProductArrivedAt =
                      /^\d{4}-\d{2}-\d{2}$/.test(y) ? y : null;
                  }
                  cohortStudyStartPending =
                    parseStudyStartPending(
                      (part as { study_start_pending?: unknown } | null)
                        ?.study_start_pending,
                    ) != null;
                  const cohortUi = resolveCohortDashboardParticipantUi({
                    participantStatus,
                    confirmedAtRaw,
                    studyStartedAtIso,
                    studyCompletedRaw,
                    todayYmd,
                  });
                  cohortConfirmed = cohortUi.cohortConfirmed;
                  cohortAwaitingStudyStart = cohortUi.cohortAwaitingStudyStart;
                  cohortStudyPersistedComplete =
                    participantStatus === "completed" ||
                    cohortUi.studyCompletedAtSet;
                  const studyStartYmd = studyStartedAtIso
                    ? studyStartedAtIso.slice(0, 10)
                    : null;
                  const studyClockHasBegun = Boolean(
                    studyStartYmd != null && studyStartYmd <= todayYmd,
                  );

                  if (enrolledAt) {
                    cohortStartDate = String(enrolledAt);
                    const enrollMs = Date.parse(String(enrolledAt));
                    if (Number.isFinite(enrollMs)) {
                      cohortComplianceDeadlineIso = new Date(
                        enrollMs + 48 * 60 * 60 * 1000,
                      ).toISOString();
                    }
                    const n = await countDistinctDailyEntriesSinceForUserIds(
                      cpUserIds,
                      String(enrolledAt),
                    );
                    cohortCheckinWelcomeRecommended = n === 0;
                  } else {
                    cohortCheckinWelcomeRecommended = true;
                    if (
                      cohortStart != null &&
                      String(cohortStart).trim() !== ""
                    ) {
                      cohortStartDate = `${String(cohortStart).slice(0, 10)}T12:00:00.000Z`;
                    }
                  }

                  // Compliance gate metrics (today’s card, welcome, 2-of-2 count): always since enrollment.
                  const complianceAnchorIso = enrolledAt
                    ? String(enrolledAt)
                    : cohortStart != null && String(cohortStart).trim() !== ""
                      ? `${String(cohortStart).slice(0, 10)}T00:00:00.000Z`
                      : `${todayYmd}T00:00:00.000Z`;

                  if (userId) {
                    const [cntCompliance, ymdsCompliance] = await Promise.all([
                      countDistinctDailyEntriesSinceForUserIds(
                        cpUserIds,
                        complianceAnchorIso,
                      ),
                      fetchCohortCheckinYmdsSinceEnrollForUserIds(
                        cpUserIds,
                        complianceAnchorIso,
                      ),
                    ]);
                    if (
                      cohortConfirmed &&
                      studyStartedAtIso &&
                      studyClockHasBegun
                    ) {
                      const studyEntryOpts = {
                        minCreatedAtIso: studyStartedAtIso,
                      } as const;
                      const [cntStudy, ymdsStudy] = await Promise.all([
                        countDistinctDailyEntriesSinceForUserIds(
                          cpUserIds,
                          studyStartedAtIso,
                          studyEntryOpts,
                        ),
                        fetchCohortCheckinYmdsSinceEnrollForUserIds(
                          cpUserIds,
                          studyStartedAtIso,
                          studyEntryOpts,
                        ),
                      ]);
                      cohortCheckinCount = cntStudy;
                      cohortCurrentStreak = consecutiveCheckinStreakFromYmds(
                        ymdsStudy,
                        todayYmd,
                      );
                      cohortHasCheckedInToday = new Set(ymdsStudy).has(
                        todayYmd,
                      );
                    } else if (cohortConfirmed && cohortAwaitingStudyStart) {
                      /**
                       * Post-confirmation baseline: distinct `local_date` after confirmed_at::date and before
                       * product_arrived_at (when set). Not enrollment-era compliance; not active-study rows.
                       */
                      const confirmedIso =
                        confirmedAtRaw != null &&
                        String(confirmedAtRaw).trim() !== ""
                          ? String(confirmedAtRaw).trim()
                          : null;
                      if (confirmedIso) {
                        const [cntPost, ymdsPost] = await Promise.all([
                          countCohortBaselineCheckinDistinctDaysForUserIds(
                            cpUserIds,
                            confirmedIso,
                            productArrivedAtRaw,
                          ),
                          fetchCohortBaselineCheckinYmdsForUserIds(
                            cpUserIds,
                            confirmedIso,
                            productArrivedAtRaw,
                          ),
                        ]);
                        cohortCheckinCount = cntPost;
                        cohortCurrentStreak =
                          consecutiveCheckinStreakFromYmds(
                            ymdsPost,
                            todayYmd,
                          );
                        /**
                         * Same-day confirm: the qualifying check-in is persisted before `confirmed_at` is set,
                         * so post-confirmation YMDs omit today even though the user already checked in.
                         * "Checked in today" must match enrollment-era semantics (any qualifying row for this local day).
                         */
                        cohortHasCheckedInToday = new Set(
                          ymdsCompliance,
                        ).has(todayYmd);
                      } else {
                        /** Rare: awaiting with no `confirmed_at` (e.g. future `study_started_at` only). */
                        cohortCheckinCount = cntCompliance;
                        cohortCurrentStreak =
                          consecutiveCheckinStreakFromYmds(
                            ymdsCompliance,
                            todayYmd,
                          );
                        cohortHasCheckedInToday = new Set(
                          ymdsCompliance,
                        ).has(todayYmd);
                      }
                    } else {
                      cohortHasCheckedInToday = new Set(ymdsCompliance).has(
                        todayYmd,
                      );
                      cohortCheckinCount = cntCompliance;
                      cohortCurrentStreak = consecutiveCheckinStreakFromYmds(
                        ymdsCompliance,
                        todayYmd,
                      );
                    }
                  }

                  if (
                    cohortStudyStartPending &&
                    (studyStartedAtIso == null ||
                      String(studyStartedAtIso).trim() === "")
                  ) {
                    cohortHasCheckedInToday = false;
                  }

                  if (
                    cohortConfirmed &&
                    studyStartedAtIso &&
                    studyClockHasBegun
                  ) {
                    const studyYmd = studyStartedAtIso.slice(0, 10);
                    cohortStudyCurrentDay = Math.max(
                      1,
                      daysBetweenInclusiveUtcYmd(studyYmd, todayYmd) + 1,
                    );
                    cohortStudyComplete =
                      cohortStudyPersistedComplete ||
                      cohortStudyCurrentDay >= cohortStudyDays;
                    cohortDaysRemaining = Math.max(
                      0,
                      cohortStudyDays - cohortStudyCurrentDay,
                    );
                  } else if (cohortConfirmed && cohortAwaitingStudyStart) {
                    cohortStudyCurrentDay = 0;
                    /** Pre–study clock: dashboard must not treat participant as “study complete” (hides check-in). `participantStatus === completed` with null study timestamps is inconsistent but must not block baseline check-ins. */
                    cohortStudyComplete = false;
                    cohortDaysRemaining = cohortStudyDays;
                  } else {
                    cohortStudyCurrentDay = 1;
                    cohortStudyComplete = cohortStudyPersistedComplete;
                    cohortDaysRemaining = cohortStudyDays;
                  }

                  if (userId && cohortUuid) {
                    try {
                      const { data: resRow } = await supabaseAdmin
                        .from("cohort_participant_results")
                        .select("published_at, status")
                        .eq("cohort_id", cohortUuid)
                        .eq("user_id", userId)
                        .maybeSingle();
                      const pAt = (resRow as { published_at?: string | null } | null)
                        ?.published_at;
                      const st = String(
                        (resRow as { status?: string | null } | null)?.status ||
                          "",
                      ).toLowerCase();
                      cohortParticipantResultPublished =
                        st === "published" &&
                        pAt != null &&
                        String(pAt).trim() !== "";
                    } catch {
                      cohortParticipantResultPublished = false;
                    }
                  }

                  // Finished study + active Pro → main BioStackr dashboard (not cohort study shell).
                  // Use the same "done" signals as the rest of this route: cron timestamp, completed
                  // status, computed study window complete, or published personal result (often visible
                  // before study_completed_at is backfilled).
                  const studyCompletedAtSet =
                    studyCompletedRaw != null &&
                    String(studyCompletedRaw).trim() !== "";
                  const studyFinishedForProduct =
                    studyCompletedAtSet ||
                    participantStatus === "completed" ||
                    cohortStudyComplete ||
                    cohortParticipantResultPublished;
                  let proExpiresForGraduation = pro_expires_at;
                  try {
                    const { data: proRow } = await supabaseAdmin
                      .from("profiles")
                      .select("pro_expires_at")
                      .eq("user_id", userId as string)
                      .maybeSingle();
                    const raw = (
                      proRow as { pro_expires_at?: string | null } | null
                    )?.pro_expires_at;
                    if (raw != null && String(raw).trim() !== "") {
                      proExpiresForGraduation = String(raw).trim();
                    }
                  } catch {
                    /* keep pro_expires_for_graduation from earlier profiles read */
                  }
                  const proExpiresMs = proExpiresForGraduation
                    ? Date.parse(String(proExpiresForGraduation))
                    : NaN;
                  const proActive =
                    Number.isFinite(proExpiresMs) && proExpiresMs > Date.now();
                  if (
                    showCohortStudyDashboard &&
                    proActive &&
                    studyFinishedForProduct
                  ) {
                    showCohortStudyDashboard = false;
                  }

                  let cohortStackAlreadyCleaned = false;
                  try {
                    const { data: cleanProfRows } = await supabaseAdmin
                      .from("profiles")
                      .select("cohort_study_stack_cleaned_at")
                      .eq("user_id", userId as string);
                    cohortStackAlreadyCleaned = Boolean(
                      (cleanProfRows || []).some(
                        (r: { cohort_study_stack_cleaned_at?: string | null }) =>
                          r.cohort_study_stack_cleaned_at,
                      ),
                    );
                  } catch {
                    cohortStackAlreadyCleaned = Boolean(
                      (
                        pAdmin as {
                          cohort_study_stack_cleaned_at?: string | null;
                        } | null
                      )?.cohort_study_stack_cleaned_at,
                    );
                  }
                  let cohortHandoffNeedsRepair = false;
                  if (
                    cohortStackAlreadyCleaned &&
                    proActive &&
                    studyFinishedForProduct &&
                    participantStatus !== "dropped" &&
                    cohortStudyProductName &&
                    profileId &&
                    userId &&
                    cohortId
                  ) {
                    cohortHandoffNeedsRepair = await needsCohortStudyStackRepair({
                      profileId: profileId as string,
                      userId: userId as string,
                      productName: cohortStudyProductName as string,
                      cohortSlug: cohortId as string,
                    });
                  }
                  const handoffCleanupEligible =
                    proActive &&
                    studyFinishedForProduct &&
                    participantStatus !== "dropped" &&
                    Boolean(cohortStudyProductName) &&
                    Boolean(profileId) &&
                    Boolean(userId) &&
                    Boolean(cohortId) &&
                    (!cohortStackAlreadyCleaned || cohortHandoffNeedsRepair);
                  if (handoffCleanupEligible) {
                    try {
                      await runCohortMainProductHandoffCleanup({
                        profileId: profileId as string,
                        userId: userId as string,
                        cohortSlug: cohortId as string,
                        productName: cohortStudyProductName as string,
                        clientTodayYmd: todayYmd,
                      });
                    } catch (e) {
                      console.error("[api/me] cohort main handoff cleanup", e);
                    }
                  }
                } catch (partCatch: unknown) {
                  console.error(
                    "[api/me] cohort participant welcome:",
                    partCatch,
                  );
                  cohortCheckinWelcomeRecommended = true;
                }
              }
            }
          }
        } catch (e: unknown) {
          console.error("[api/me] cohort block unexpected:", e);
        }

        if (
          (cohortId == null || String(cohortId).trim() === "") &&
          prof &&
          typeof prof === "object"
        ) {
          const rawC = (prof as { cohort_id?: unknown }).cohort_id;
          if (rawC != null && String(rawC).trim() !== "") {
            cohortId = String(rawC).trim();
          }
        }

        if (!firstName) {
          const { data: profile } = await supabase
            .from("app_user")
            .select("first_name, display_name, full_name")
            .eq("id", userId)
            .maybeSingle();
          const fromProfile =
            (profile as any)?.first_name ||
            (profile as any)?.display_name ||
            ((profile as any)?.full_name
              ? String((profile as any)?.full_name).split(" ")[0]
              : null);
          if (fromProfile) firstName = String(fromProfile);
        }
      }
    } catch {}

    if (!firstName) {
      const meta = (user as any)?.user_metadata || {};
      firstName =
        meta.first_name ||
        meta.name ||
        (meta.full_name ? String(meta.full_name).split(" ")[0] : null) ||
        (email ? String(email).split("@")[0] : null);
    }

    // TEMP: remove after cohort dashboard routing is verified (check Vercel/server logs).
    console.log("[api/me] cohort routing debug", {
      email,
      cohortId,
      cohortParticipantStatus,
      cohortParticipantDropped,
      showCohortStudyDashboard,
    });

    if (cohortId && userId) {
      try {
        cohortCheckinBranch = await shouldUseCohortCheckinBranch({
          authUserId: userId as string,
          cohortSlug: cohortId,
          todayYmd: todayYmdForCohort(request),
        });
      } catch (e: unknown) {
        console.error(
          "[api/me] cohortCheckinBranch",
          e instanceof Error ? e.message : e,
        );
      }
    }

    return NextResponse.json({
      firstName: firstName || null,
      profileWelcomeFirstName,
      email,
      userId,
      tier,
      pro_expires_at,
      cohortId,
      checkinFields,
      cohortCheckinWelcomeRecommended,
      cohortStudyProductName,
      cohortCheckinCount,
      cohortStartDate,
      cohortStudyDays,
      cohortCurrentStreak,
      cohortStudyEndDate,
      cohortStudyIsActive,
      cohortHasCheckedInToday,
      cohortStudyBrandName,
      cohortStudyCurrentDay,
      cohortDaysRemaining,
      cohortStudyComplete,
      cohortConfirmed,
      cohortComplianceDeadlineIso,
      cohortAwaitingStudyStart,
      cohortStudyStartedAtIso,
      cohortStudyPersistedComplete,
      cohortParticipantResultPublished,
      showCohortStudyDashboard,
      cohortParticipantDropped,
      cohortParticipantStatus,
      cohortCompletionRewardStoreCredit,
      cohortStoreCreditTitle,
      cohortCheckinBranch,
      cohortParticipantConfirmedAtIso,
      cohortParticipantProductArrivedAt,
      cohortStudyStartPending,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 },
    );
  }
}
