import prisma from './prisma';

/**
 * Smart List Manager
 * 
 * Manages automatic list creation and deletion based on tag assignments.
 * - Lists are created only when at least one contact has a tag
 * - Lists are deleted when no contacts have that tag or when tag is deleted
 */
export class SmartListManager {
  /**
   * Ensure a smart list exists for a tag and add contact to it
   * Creates the list if it doesn't exist (since we're adding a contact, we know at least one has the tag)
   */
  static async addContactToTagList(tagId: string, contactId: string): Promise<void> {
    console.log(`📝 SmartListManager.addContactToTagList called for tag ${tagId}, contact ${contactId}`);
    
    // Check if list exists for this tag
    let list = await prisma.list.findFirst({
      where: {
        tagId,
        isAutomatic: true
      }
    });
    
    console.log(`📋 Existing list for tag ${tagId}:`, list ? `Found: ${list.name}` : 'Not found');

    // If list doesn't exist, create it
    // We know at least one contact has this tag (the one we're adding)
    if (!list) {
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        select: { name: true, value: true }
      });

      if (tag) {
        try {
          list = await prisma.list.create({
            data: {
              name: tag.value ? `${tag.name}: ${tag.value}` : tag.name,
              description: `Automatic list for ${tag.name}${tag.value ? ` (${tag.value})` : ''} tag`,
              isAutomatic: true,
              tagId: tagId
            }
          });
          console.log(`✅ Created smart list "${list.name}" for tag ${tagId}`);
        } catch (error) {
          console.error(`❌ Failed to create smart list for tag ${tagId}:`, error);
          // If creation fails (e.g., duplicate), try to find existing list
          list = await prisma.list.findFirst({
            where: {
              tagId,
              isAutomatic: true
            }
          });
        }
      } else {
        // Tag doesn't exist, can't create list
        console.warn(`⚠️ Tag ${tagId} not found, cannot create smart list`);
        return;
      }
    }

    // Add contact to list (only if list was successfully created/found)
    if (list) {
      await prisma.listMember.upsert({
        where: {
          listId_contactId: {
            listId: list.id,
            contactId
          }
        },
        create: {
          listId: list.id,
          contactId
        },
        update: {} // No update needed, just ensure it exists
      });
    } else {
      console.error(`❌ Could not create or find list for tag ${tagId}, cannot add contact ${contactId}`);
    }
  }

  /**
   * Remove contact from tag list and delete list if it becomes empty
   */
  static async removeContactFromTagList(tagId: string, contactId: string): Promise<void> {
    const list = await prisma.list.findFirst({
      where: {
        tagId,
        isAutomatic: true
      },
      include: {
        members: true
      }
    });

    if (!list) {
      return; // List doesn't exist, nothing to do
    }

    // Remove contact from list
    await prisma.listMember.deleteMany({
      where: {
        listId: list.id,
        contactId
      }
    });

    // Check if list is now empty (no members left)
    const remainingMembers = await prisma.listMember.count({
      where: { listId: list.id }
    });

    // Also check if any contacts still have this tag
    const contactsWithTag = await prisma.contactTag.count({
      where: { tagId }
    });

    // Delete list if no members and no contacts have this tag
    if (remainingMembers === 0 && contactsWithTag === 0) {
      await prisma.list.delete({
        where: { id: list.id }
      });
    }
  }

  /**
   * Sync all contacts with a tag to the smart list
   * Creates list if needed, adds all contacts, removes contacts that shouldn't be there
   */
  static async syncTagList(tagId: string): Promise<void> {
    // Get all contacts with this tag
    const contactsWithTag = await prisma.contactTag.findMany({
      where: { tagId },
      select: { contactId: true }
    });

    const contactIds = contactsWithTag.map(ct => ct.contactId);

    // If no contacts have this tag, delete the list if it exists
    if (contactIds.length === 0) {
      await prisma.list.deleteMany({
        where: {
          tagId,
          isAutomatic: true
        }
      });
      return;
    }

    // Get or create the list
    let list = await prisma.list.findFirst({
      where: {
        tagId,
        isAutomatic: true
      }
    });

    if (!list) {
      const tag = await prisma.tag.findUnique({
        where: { id: tagId },
        select: { name: true, value: true }
      });

      if (tag) {
        list = await prisma.list.create({
          data: {
            name: tag.value ? `${tag.name}: ${tag.value}` : tag.name,
            description: `Automatic list for ${tag.name}${tag.value ? ` (${tag.value})` : ''} tag`,
            isAutomatic: true,
            tagId: tagId
          }
        });
      } else {
        return; // Tag doesn't exist
      }
    }

    // Get current list members
    const currentMembers = await prisma.listMember.findMany({
      where: { listId: list.id },
      select: { contactId: true }
    });

    const currentContactIds = currentMembers.map(m => m.contactId);

    // Add contacts that should be in the list but aren't
    const toAdd = contactIds.filter(id => !currentContactIds.includes(id));
    if (toAdd.length > 0) {
      await prisma.listMember.createMany({
        data: toAdd.map(contactId => ({
          listId: list!.id,
          contactId
        })),
        skipDuplicates: true
      });
    }

    // Remove contacts that shouldn't be in the list
    const toRemove = currentContactIds.filter(id => !contactIds.includes(id));
    if (toRemove.length > 0) {
      await prisma.listMember.deleteMany({
        where: {
          listId: list.id,
          contactId: { in: toRemove }
        }
      });
    }
  }

  /**
   * Delete smart list for a tag (used when tag is deleted)
   */
  static async deleteTagList(tagId: string): Promise<void> {
    await prisma.list.deleteMany({
      where: {
        tagId,
        isAutomatic: true
      }
    });
  }

  /**
   * Update smart list name and description when tag is updated
   */
  static async updateTagList(tagId: string): Promise<void> {
    const tag = await prisma.tag.findUnique({
      where: { id: tagId },
      select: { name: true, value: true }
    });

    if (!tag) {
      return;
    }

    await prisma.list.updateMany({
      where: {
        tagId,
        isAutomatic: true
      },
      data: {
        name: tag.value ? `${tag.name}: ${tag.value}` : tag.name,
        description: `Automatic list for ${tag.name}${tag.value ? ` (${tag.value})` : ''} tag`
      }
    });
  }

  /**
   * Cleanup empty smart lists (lists with no members and no contacts with the tag)
   */
  static async cleanupEmptyLists(): Promise<void> {
    const emptyLists = await prisma.list.findMany({
      where: {
        isAutomatic: true
      },
      include: {
        _count: {
          select: {
            members: true
          }
        },
        tag: {
          include: {
            _count: {
              select: {
                contacts: true
              }
            }
          }
        }
      }
    });

    const listsToDelete = emptyLists.filter(list => {
      const hasMembers = list._count.members > 0;
      const tagContactCount = list.tag?._count?.contacts ?? 0;
      const hasContactsWithTag = tagContactCount > 0;
      return !hasMembers && !hasContactsWithTag;
    });

    if (listsToDelete.length > 0) {
      await prisma.list.deleteMany({
        where: {
          id: { in: listsToDelete.map(l => l.id) }
        }
      });
    }
  }
}
