// Trello Board Integration Service - AI Project Intelligence Platform
// Path: src/lib/core/infrastructure/trello.ts

import { TrelloRepository, TaskRepository, ActivityRepository } from './supabase';
import { TrelloBoard, Task, TaskStatus } from '../domain/types';

export class TrelloService {
  private trelloRepo = new TrelloRepository();
  private taskRepo = new TaskRepository();
  private activityRepo = new ActivityRepository();

  // Sync cards from a Trello board
  async syncBoard(
    projectId: string,
    apiKey: string,
    token: string,
    boardId: string
  ): Promise<Task[]> {
    const isMock = !apiKey || !boardId;

    if (isMock) {
      console.log(`Syncing Trello board in MOCK mode for project: ${projectId}`);
      // Generate some mock cards representing tasks
      const mockCards = [
        {
          id: 'card-1',
          name: 'Setup Next.js dashboard project layout',
          desc: 'Configure tailwind theme, layouts, and routing hooks.',
          status: 'Done' as TaskStatus,
          due: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
          labels: [{ name: 'Frontend' }, { name: 'Setup' }],
        },
        {
          id: 'card-2',
          name: 'Database migrations for Supabase',
          desc: 'Create SQL files, configure tables, constraints, indexes, views, and RLS.',
          status: 'Done' as TaskStatus,
          due: new Date(Date.now() - 3600000 * 12).toISOString(), // 12 hours ago
          labels: [{ name: 'Backend' }, { name: 'Database' }],
        },
        {
          id: 'card-3',
          name: 'Email IMAP classification logic',
          desc: 'Connect to IMAP and run Claude prompt for classifying priority.',
          status: 'In Progress' as TaskStatus,
          due: new Date(Date.now() + 3600000 * 48).toISOString(), // 2 days from now
          labels: [{ name: 'Backend' }, { name: 'AI' }],
        },
        {
          id: 'card-4',
          name: 'Telegram Bot Settings Menu',
          desc: 'Write the interactive keyboard menu in the Telegram bot.',
          status: 'Todo' as TaskStatus,
          due: new Date(Date.now() + 3600000 * 72).toISOString(), // 3 days from now
          labels: [{ name: 'Telegram' }, { name: 'Bot' }],
        },
      ];

      // Sync with repository
      await this.taskRepo.syncTrelloTasks(projectId, mockCards);
      
      // Update Board synced timestamp
      let board = await this.trelloRepo.getByProject(projectId);
      if (!board) {
        board = await this.trelloRepo.save({
          projectId,
          trelloBoardId: boardId || 'mock-board-id',
          name: 'AI OS Core Development',
          url: 'https://trello.com/b/mock-board',
          listMappings: {
            'list-todo': 'Todo',
            'list-prog': 'In Progress',
            'list-done': 'Done',
          },
          syncedAt: new Date(),
        });
      } else {
        await this.trelloRepo.save({
          ...board,
          syncedAt: new Date(),
        });
      }

      await this.activityRepo.log(
        projectId,
        'Trello Board Synchronized',
        `Successfully synchronized ${mockCards.length} cards from Trello board "AI OS Core Development" (MOCK Mode)`,
        { cardCount: mockCards.length }
      );

      return await this.taskRepo.listByProject(projectId);
    }

    // REAL TRELLO BOARD SYNC
    try {
      console.log(`Connecting to Trello API. Board: ${boardId}`);
      
      // 1. Fetch Lists to map status
      const listsUrl = `https://api.trello.com/1/boards/${boardId}/lists?key=${apiKey}&token=${token}`;
      const listsRes = await fetch(listsUrl);
      if (!listsRes.ok) throw new Error('Failed to fetch Trello lists');
      const lists = await listsRes.json();

      // 2. Fetch Cards
      const cardsUrl = `https://api.trello.com/1/boards/${boardId}/cards?key=${apiKey}&token=${token}&fields=name,desc,due,labels,idList`;
      const cardsRes = await fetch(cardsUrl);
      if (!cardsRes.ok) throw new Error('Failed to fetch Trello cards');
      const cards = await cardsRes.json();

      // Get mappings
      const boardConfig = await this.trelloRepo.getByProject(projectId);
      const listMappings = boardConfig?.listMappings || {};

      // Map lists
      const mappedCards = cards.map((card: any) => {
        // Find mapped status from list mappings or use default
        let status: TaskStatus = 'Todo';
        const mappedStatus = listMappings[card.idList];
        if (mappedStatus) {
          status = mappedStatus;
        } else {
          // Standard heuristic if mappings not defined
          const listName = lists.find((l: any) => l.id === card.idList)?.name.toLowerCase() || '';
          if (listName.includes('done') || listName.includes('finished')) status = 'Done';
          else if (listName.includes('qa') || listName.includes('review') || listName.includes('testing')) status = 'QA';
          else if (listName.includes('progress') || listName.includes('doing')) status = 'In Progress';
          else if (listName.includes('block') || listName.includes('hold')) status = 'Blocked';
        }

        return {
          id: card.id,
          name: card.name,
          desc: card.desc,
          status,
          due: card.due,
          labels: card.labels || [],
        };
      });

      // Write to DB
      await this.taskRepo.syncTrelloTasks(projectId, mappedCards);

      // Save sync status
      if (boardConfig) {
        await this.trelloRepo.save({
          ...boardConfig,
          syncedAt: new Date(),
        });
      }

      await this.activityRepo.log(
        projectId,
        'Trello Board Synchronized',
        `Successfully synchronized ${mappedCards.length} cards from Trello Board "${boardConfig?.name || boardId}"`,
        { cardCount: mappedCards.length }
      );

      return await this.taskRepo.listByProject(projectId);
    } catch (e: any) {
      console.error('Trello sync failed:', e);
      throw e;
    }
  }
}
