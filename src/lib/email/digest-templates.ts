export interface DigestChange {
  id: string
  item_type: 'supplement' | 'protocol' | 'movement' | 'mindfulness' | 'food' | 'uploads'
  change_type: 'added' | 'removed' | 'updated'
  fields: Record<string, any>
  changed_at: string
}

export interface CoalescedChange {
  item_type: string
  item_name: string
  change_type: 'added' | 'removed' | 'updated'
  summary: string
  details?: string[]
}

export interface DigestData {
  ownerName: string
  ownerSlug: string
  followerEmail: string
  cadence: 'daily' | 'weekly'
  changes: CoalescedChange[]
  profileUrl: string
  manageUrl: string
  unsubscribeUrl: string
  periodStart: string
  periodEnd: string
}

/**
 * Coalesce multiple changes to the same item within a time window
 */
export function coalesceChanges(changes: DigestChange[]): CoalescedChange[] {
  const grouped = new Map<string, DigestChange[]>()
  
  // Group changes by item
  changes.forEach(change => {
    const key = `${change.item_type}:${change.fields?.name || 'Unknown'}`
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(change)
  })

  const coalesced: CoalescedChange[] = []

  grouped.forEach((itemChanges, key) => {
    const [itemType, itemName] = key.split(':')
    
    // Sort by timestamp
    itemChanges.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime())
    
    const firstChange = itemChanges[0]
    const lastChange = itemChanges[itemChanges.length - 1]

    if (itemChanges.length === 1) {
      // Single change
      const change = firstChange
      coalesced.push({
        item_type: itemType,
        item_name: itemName,
        change_type: change.change_type,
        summary: formatSingleChange(change),
        details: change.change_type === 'updated' ? formatUpdateDetails(change.fields) : undefined
      })
    } else {
      // Multiple changes - coalesce
      const hasAdded = itemChanges.some(c => c.change_type === 'added')
      const hasRemoved = itemChanges.some(c => c.change_type === 'removed')
      const updates = itemChanges.filter(c => c.change_type === 'updated')

      if (hasAdded && hasRemoved) {
        // Added then removed = no net change (skip)
        return
      } else if (hasAdded) {
        // Net addition
        coalesced.push({
          item_type: itemType,
          item_name: itemName,
          change_type: 'added',
          summary: `Added ${itemName}`,
          details: updates.length > 0 ? [`Updated ${updates.length} time${updates.length > 1 ? 's' : ''}`] : undefined
        })
      } else if (hasRemoved) {
        // Net removal
        coalesced.push({
          item_type: itemType,
          item_name: itemName,
          change_type: 'removed',
          summary: `Removed ${itemName}`
        })
      } else if (updates.length > 0) {
        // Only updates
        const allFields = new Set<string>()
        updates.forEach(update => {
          Object.keys(update.fields || {}).forEach(field => allFields.add(field))
        })
        
        coalesced.push({
          item_type: itemType,
          item_name: itemName,
          change_type: 'updated',
          summary: `Updated ${itemName}`,
          details: Array.from(allFields).map(field => {
            const latestUpdate = updates.reverse().find(u => u.fields?.[field])
            return latestUpdate ? formatFieldChange(field, latestUpdate.fields[field]) : null
          }).filter(Boolean) as string[]
        })
      }
    }
  })

  return coalesced
}

function formatSingleChange(change: DigestChange): string {
  const itemName = change.fields?.name || 'Unknown item'
  
  switch (change.change_type) {
    case 'added':
      return `Added ${itemName}`
    case 'removed':
      return `Removed ${itemName}`
    case 'updated':
      return `Updated ${itemName}`
    default:
      return `Changed ${itemName}`
  }
}

function formatUpdateDetails(fields: Record<string, any>): string[] {
  const details: string[] = []
  
  Object.entries(fields).forEach(([key, value]) => {
    if (typeof value === 'object' && value.from !== undefined && value.to !== undefined) {
      details.push(formatFieldChange(key, value))
    }
  })
  
  return details
}

function formatFieldChange(fieldName: string, change: { from: any; to: any }): string {
  const displayName = fieldName === 'dose' ? 'Dose' : 
                     fieldName === 'timing' ? 'Timing' :
                     fieldName === 'frequency' ? 'Frequency' :
                     fieldName === 'brand' ? 'Brand' :
                     fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
  
  if (change.from === null || change.from === '') {
    return `${displayName}: added "${change.to}"`
  } else if (change.to === null || change.to === '') {
    return `${displayName}: removed`
  } else {
    return `${displayName}: ${change.from} → ${change.to}`
  }
}

function getItemIcon(itemType: string): string {
  switch (itemType) {
    case 'supplement': return '💊'
    case 'protocol': return '📋'
    case 'movement': return '🏃‍♂️'
    case 'mindfulness': return '🧘‍♀️'
    case 'food': return '🍽️'
    case 'uploads': return '📄'
    default: return '📝'
  }
}

export function generateWeeklyDigestHTML(data: DigestData): string {
  const { ownerName, changes, profileUrl, manageUrl, unsubscribeUrl } = data
  
  const changesByType = changes.reduce((acc, change) => {
    if (!acc[change.item_type]) {
      acc[change.item_type] = []
    }
    acc[change.item_type].push(change)
    return acc
  }, {} as Record<string, CoalescedChange[]>)

  // Count changes by type for summary
  const supplementChanges = changesByType.supplement?.length || 0
  const protocolChanges = changesByType.protocol?.length || 0
  const movementChanges = changesByType.movement?.length || 0
  const mindfulnessChanges = changesByType.mindfulness?.length || 0
  
  const totalChanges = supplementChanges + protocolChanges + movementChanges + mindfulnessChanges

  const getSummaryLine = () => {
    const parts = []
    if (supplementChanges > 0) parts.push(`${supplementChanges} supplement update${supplementChanges > 1 ? 's' : ''}`)
    if (protocolChanges > 0) parts.push(`${protocolChanges} protocol update${protocolChanges > 1 ? 's' : ''}`)
    if (movementChanges > 0) parts.push(`${movementChanges} movement update${movementChanges > 1 ? 's' : ''}`)
    if (mindfulnessChanges > 0) parts.push(`${mindfulnessChanges} mindfulness update${mindfulnessChanges > 1 ? 's' : ''}`)
    
    if (parts.length === 0) return 'No changes this week'
    if (parts.length === 1) return parts[0]
    if (parts.length === 2) return `${parts[0]}, ${parts[1]}`
    return `${parts.slice(0, -1).join(', ')}, ${parts[parts.length - 1]}`
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>This Week in ${ownerName}'s Stack</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: #111827; color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.025em; }
        .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.8; }
        .content { padding: 24px; }
        .summary { font-size: 16px; color: #6b7280; margin-bottom: 32px; text-align: center; }
        .section { margin-bottom: 24px; }
        .section h2 { color: #111827; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
        .change-list { }
        .change-item { padding: 8px 0; color: #374151; }
        .change-item:last-child { border-bottom: none; }
        .change-summary { font-weight: 500; }
        .cta { text-align: center; margin: 32px 0; }
        .cta-button { display: inline-block; background: #111827; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin: 0 8px; }
        .cta-secondary { display: inline-block; color: #6b7280; padding: 12px 24px; text-decoration: none; font-weight: 500; margin: 0 8px; }
        .footer { background: #f9fafb; padding: 24px; text-align: center; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; }
        .footer a { color: #111827; text-decoration: none; }
        .empty-state { text-align: center; color: #6b7280; padding: 32px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>This Week in ${ownerName}'s Stack</h1>
          <p>${getSummaryLine()}</p>
        </div>
        
        <div class="content">
          ${totalChanges === 0 ? `
            <div class="empty-state">
              No changes this week.
            </div>
          ` : ''}

          ${Object.entries(changesByType).map(([type, typeChanges]) => `
            <div class="section">
              <h2>${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
              <div class="change-list">
                ${typeChanges.map(change => `
                  <div class="change-item">
                    <div class="change-summary">- ${change.summary.replace(/^(Added|Removed|Updated) /, '')}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}

          <div class="cta">
            <a href="${profileUrl}" class="cta-button">View Full Stack</a>
            <a href="${manageUrl}" class="cta-secondary">Manage Emails</a>
            <a href="${unsubscribeUrl}" class="cta-secondary">Unsubscribe</a>
          </div>
        </div>

        <div class="footer">
          <p>Biostackr</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export function generateDailyDigestHTML(data: DigestData): string {
  // Similar to weekly but with "yesterday" language
  return generateWeeklyDigestHTML(data).replace(
    'This week in',
    'Yesterday in'
  ).replace(
    'this week:',
    'yesterday:'
  ).replace(
    'No changes this week',
    'No changes yesterday'
  )
}
