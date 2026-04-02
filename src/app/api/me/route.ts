import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { normalizeCohortCheckinFields } from "@/lib/cohortCheckinFields";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  countDistinctDailyEntriesSinceForUserIds,
  consecutiveCheckinStreakFromYmds,
  daysBetweenInclusiveUtcYmd,
  fetchCohortCheckinYmdsSinceEnrollForUserIds,
} from "@/lib/cohortCheckinCount";
import { cohortParticipantUserIdCandidatesSync } from "@/lib/cohortParticipantUserId";

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
    let profileWelcomeFirstName: string | null = null;
    /** True when this user should see the cohort study dashboard (/dashboard), not the B2C stack dashboard. */
    let showCohortStudyDashboard = false;
    /** Set when we load cohort_participants (debug / logging); null if not in cohort participant path. */
    let cohortParticipantStatus: string | null = null;

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
            .select("id, cohort_id, display_name")
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

          if (cohortId && profileId) {
            const todayYmd = todayYmdForCohort(request);
            const { data: cdef, error: cdefErr } = await supabaseAdmin
              .from("cohorts")
              .select(
                "id, checkin_fields, product_name, brand_name, study_days, start_date, end_date",
              )
              .eq("slug", cohortId)
              .maybeSingle();
            if (cdefErr) {
              console.error(
                "[api/me] cohorts lookup:",
                cohortId,
                cdefErr.message,
              );
            }
            if (
              cdef != null &&
              Array.isArray(
                (cdef as { checkin_fields?: unknown }).checkin_fields,
              )
            ) {
              checkinFields = normalizeCohortCheckinFields(
                (cdef as { checkin_fields: unknown }).checkin_fields,
              );
            }

            if (cdef != null) {
              showCohortStudyDashboard = true;
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
                    profileId,
                    userId,
                  );
                  const { data: part, error: partErr } = await supabaseAdmin
                    .from("cohort_participants")
                    .select("enrolled_at, confirmed_at, study_started_at, status")
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
                  } else if (
                    participantStatus &&
                    !["applied", "confirmed", "completed"].includes(
                      participantStatus,
                    )
                  ) {
                    showCohortStudyDashboard = false;
                  }
                  // Shipment / post-gate UX requires status confirmed — not only confirmed_at (can diverge if data is inconsistent).
                  cohortConfirmed =
                    participantStatus === "confirmed" &&
                    confirmedAtRaw != null &&
                    String(confirmedAtRaw).trim() !== "";
                  const confirmedAtIso = cohortConfirmed
                    ? String(confirmedAtRaw).trim()
                    : null;
                  const studyStartedRaw = (
                    part as { study_started_at?: string | null } | null
                  )?.study_started_at;
                  const studyStartedAtIso =
                    studyStartedRaw != null &&
                    String(studyStartedRaw).trim() !== ""
                      ? String(studyStartedRaw).trim()
                      : null;
                  cohortStudyStartedAtIso = studyStartedAtIso;
                  const studyStartYmd = studyStartedAtIso
                    ? studyStartedAtIso.slice(0, 10)
                    : null;
                  const studyClockHasBegun = Boolean(
                    studyStartYmd != null && studyStartYmd <= todayYmd,
                  );
                  cohortAwaitingStudyStart = Boolean(
                    cohortConfirmed &&
                      (!studyStartedAtIso || !studyClockHasBegun),
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
                      const [cntStudy, ymdsStudy] = await Promise.all([
                        countDistinctDailyEntriesSinceForUserIds(
                          cpUserIds,
                          studyStartedAtIso,
                        ),
                        fetchCohortCheckinYmdsSinceEnrollForUserIds(
                          cpUserIds,
                          studyStartedAtIso,
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
                      cohortCheckinCount = 0;
                      cohortCurrentStreak = 0;
                      cohortHasCheckedInToday = false;
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
                      cohortStudyCurrentDay >= cohortStudyDays;
                    cohortDaysRemaining = Math.max(
                      0,
                      cohortStudyDays - cohortStudyCurrentDay,
                    );
                  } else if (cohortConfirmed && cohortAwaitingStudyStart) {
                    cohortStudyCurrentDay = 0;
                    cohortStudyComplete = false;
                    cohortDaysRemaining = cohortStudyDays;
                  } else {
                    cohortStudyCurrentDay = 1;
                    cohortStudyComplete = false;
                    cohortDaysRemaining = cohortStudyDays;
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
      showCohortStudyDashboard,
    });

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
      showCohortStudyDashboard,
      cohortParticipantStatus,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed" },
      { status: 500 },
    );
  }
}
