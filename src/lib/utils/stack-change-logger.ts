import { createClient } from '../supabase/server'

export type ItemType = 'supplement' | 'protocol' | 'movement' | 'mindfulness' | 'food' | 'uploads'
export type ChangeType = 'added' | 'removed' | 'updated'

export interface StackChangeData {
  ownerUserId: string
  itemType: ItemType
  itemId: string
  changeType: ChangeType
  fields?: Record<string, any>
  isPublic: boolean
}

/**
 * Logs a change to a user's stack for digest generation
 */
export async function logStackChange(data: StackChangeData): Promise<void> {
  try {
    const supabase = await createClient()
    
    const { error } = await supabase
      .from('stack_change_log')
      .insert({
        owner_user_id: data.ownerUserId,
        item_type: data.itemType,
        item_id: data.itemId,
        change_type: data.changeType,
        fields: data.fields || null,
        is_public: data.isPublic,
        changed_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log stack change:', error)
      // Don't throw - logging failures shouldn't break the main operation
    }
  } catch (error) {
    console.error('Error logging stack change:', error)
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Helper to create field diff for updates
 */
export function createFieldDiff(
  oldItem: Record<string, any>, 
  newItem: Record<string, any>
): Record<string, { from: any; to: any }> {
  const diff: Record<string, { from: any; to: any }> = {}
  
  // Compare all fields in the new item
  Object.keys(newItem).forEach(key => {
    if (oldItem[key] !== newItem[key]) {
      diff[key] = {
        from: oldItem[key],
        to: newItem[key]
      }
    }
  })
  
  // Check for removed fields
  Object.keys(oldItem).forEach(key => {
    if (!(key in newItem) && oldItem[key] != null) {
      diff[key] = {
        from: oldItem[key],
        to: null
      }
    }
  })
  
  return diff
}

/**
 * Convenience functions for common operations
 */
export const StackChangeLogger = {
  /**
   * Log when a supplement is added
   */
  async supplementAdded(ownerUserId: string, supplement: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'supplement',
      itemId: supplement.id,
      changeType: 'added',
      fields: {
        name: supplement.name,
        dose: supplement.dose,
        timing: supplement.timing,
        brand: supplement.brand
      },
      isPublic: supplement.public || false
    })
  },

  /**
   * Log when a supplement is updated
   */
  async supplementUpdated(ownerUserId: string, oldSupplement: any, newSupplement: any) {
    const diff = createFieldDiff(oldSupplement, newSupplement)
    
    if (Object.keys(diff).length > 0) {
      await logStackChange({
        ownerUserId,
        itemType: 'supplement',
        itemId: newSupplement.id,
        changeType: 'updated',
        fields: diff,
        isPublic: newSupplement.public || false
      })
    }
  },

  /**
   * Log when a supplement is removed
   */
  async supplementRemoved(ownerUserId: string, supplement: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'supplement',
      itemId: supplement.id,
      changeType: 'removed',
      fields: {
        name: supplement.name,
        dose: supplement.dose
      },
      isPublic: supplement.public || false
    })
  },

  /**
   * Log when a protocol is added
   */
  async protocolAdded(ownerUserId: string, protocol: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'protocol',
      itemId: protocol.id,
      changeType: 'added',
      fields: {
        name: protocol.name,
        frequency: protocol.frequency,
        details: protocol.details
      },
      isPublic: protocol.public || false
    })
  },

  /**
   * Log when a protocol is updated
   */
  async protocolUpdated(ownerUserId: string, oldProtocol: any, newProtocol: any) {
    const diff = createFieldDiff(oldProtocol, newProtocol)
    
    if (Object.keys(diff).length > 0) {
      await logStackChange({
        ownerUserId,
        itemType: 'protocol',
        itemId: newProtocol.id,
        changeType: 'updated',
        fields: diff,
        isPublic: newProtocol.public || false
      })
    }
  },

  /**
   * Log when a protocol is removed
   */
  async protocolRemoved(ownerUserId: string, protocol: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'protocol',
      itemId: protocol.id,
      changeType: 'removed',
      fields: {
        name: protocol.name,
        frequency: protocol.frequency
      },
      isPublic: protocol.public || false
    })
  },

  /**
   * Log when movement is added
   */
  async movementAdded(ownerUserId: string, movement: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'movement',
      itemId: movement.id,
      changeType: 'added',
      fields: {
        name: movement.name,
        dose: movement.dose,
        timing: movement.timing,
        notes: movement.notes
      },
      isPublic: movement.public || false
    })
  },

  /**
   * Log when movement is updated
   */
  async movementUpdated(ownerUserId: string, oldMovement: any, newMovement: any) {
    const diff = createFieldDiff(oldMovement, newMovement)
    
    if (Object.keys(diff).length > 0) {
      await logStackChange({
        ownerUserId,
        itemType: 'movement',
        itemId: newMovement.id,
        changeType: 'updated',
        fields: diff,
        isPublic: newMovement.public || false
      })
    }
  },

  /**
   * Log when movement is removed
   */
  async movementRemoved(ownerUserId: string, movement: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'movement',
      itemId: movement.id,
      changeType: 'removed',
      fields: {
        name: movement.name,
        dose: movement.dose
      },
      isPublic: movement.public || false
    })
  },

  /**
   * Log when mindfulness is added
   */
  async mindfulnessAdded(ownerUserId: string, mindfulness: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'mindfulness',
      itemId: mindfulness.id,
      changeType: 'added',
      fields: {
        name: mindfulness.name,
        dose: mindfulness.dose,
        timing: mindfulness.timing,
        notes: mindfulness.notes
      },
      isPublic: mindfulness.public || false
    })
  },

  /**
   * Log when mindfulness is updated
   */
  async mindfulnessUpdated(ownerUserId: string, oldMindfulness: any, newMindfulness: any) {
    const diff = createFieldDiff(oldMindfulness, newMindfulness)
    
    if (Object.keys(diff).length > 0) {
      await logStackChange({
        ownerUserId,
        itemType: 'mindfulness',
        itemId: newMindfulness.id,
        changeType: 'updated',
        fields: diff,
        isPublic: newMindfulness.public || false
      })
    }
  },

  /**
   * Log when mindfulness is removed
   */
  async mindfulnessRemoved(ownerUserId: string, mindfulness: any) {
    await logStackChange({
      ownerUserId,
      itemType: 'mindfulness',
      itemId: mindfulness.id,
      changeType: 'removed',
      fields: {
        name: mindfulness.name,
        dose: mindfulness.dose
      },
      isPublic: mindfulness.public || false
    })
  }
}
