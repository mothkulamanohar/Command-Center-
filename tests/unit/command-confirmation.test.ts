import { describe, it, expect, beforeEach } from 'vitest';
import { taskStore } from '@/lib/store/taskStore';
import { parseCommand } from '@/lib/cmd/parse';

describe('Command Confirmation Action & Task Store Integration', () => {
  beforeEach(() => {
    // Reset tasks and notifications to clean initial state
    taskStore.reset();
  });

  it('Command 1: "Ask Hari to check fee page by tomorrow, chase daily" delegates and adds to imChasing', () => {
    const input = 'Ask Hari to check fee page by tomorrow, chase daily';
    const parsed = parseCommand(input);

    expect(parsed.intent).toBe('ASSIGN_WITH_CHASE');
    expect(parsed.slots.owner).toBe('Hari');
    expect(parsed.slots.cadence).toBe('DAILY');

    // Execute assignment action
    const assignedTask = taskStore.assignTask({
      title: parsed.slots.title || 'check fee page',
      ownerName: parsed.slots.owner || 'Hari',
      cadence: 'Daily at 09:30 AM',
      dueDate: new Date('2026-09-30T12:30:00.000Z'),
    });

    expect(assignedTask).toBeDefined();
    expect(assignedTask.title).toBe('check fee page');
    expect(assignedTask.owner?.name).toBe('Hari');
    expect(assignedTask.requesterName).toBe('Sri');

    // Verify task state in store
    const state = taskStore.getTasks();
    const chasingTask = state.imChasing.find((t) => t.id === assignedTask.id);
    expect(chasingTask).toBeDefined();
    expect(chasingTask?.title).toBe('check fee page');
    expect(chasingTask?.owner?.name).toBe('Hari');
    expect(chasingTask?.tags).toContain('chase');

    // Verify notification created for Hari
    const notifs = taskStore.getNotifications();
    const notif = notifs.find((n) => n.title.includes('Task assigned to Hari'));
    expect(notif).toBeDefined();
    expect(notif?.title).toContain('check fee page');
  });

  it('Command 2: "Add: VC wants placement report by Monday" adds task to iOwe', () => {
    const input = 'Add: VC wants placement report by Monday';
    const parsed = parseCommand(input);

    expect(parsed.intent).toBe('ADD_TASK');
    expect(parsed.slots.requesterName).toBe('VC');

    // Execute add action
    const addedTask = taskStore.addTask({
      title: parsed.slots.title || 'VC wants placement report by Monday',
      requesterName: parsed.slots.requesterName || 'VC',
    });

    expect(addedTask).toBeDefined();
    expect(addedTask.title).toContain('placement report');

    // Verify task state in store
    const state = taskStore.getTasks();
    const iOweTask = state.iOwe.find((t) => t.id === addedTask.id);
    expect(iOweTask).toBeDefined();
    expect(iOweTask?.title).toContain('placement report');

    // Verify notification created
    const notifs = taskStore.getNotifications();
    expect(notifs.some((n) => n.title.includes('placement report'))).toBe(true);
  });

  it('Command 3: "Pass UOS rollout to Hari" passes turn to Hari in shared tasks', () => {
    const input = 'Pass UOS rollout to Hari';
    const parsed = parseCommand(input);

    expect(parsed.intent).toBe('PASS_TURN');
    expect(parsed.slots.targetUser).toBe('Hari');

    // Execute pass turn action
    const passedTask = taskStore.passTurn({
      taskTitle: parsed.slots.title || 'UOS rollout',
      partnerName: parsed.slots.targetUser || 'Hari',
    });

    expect(passedTask).toBeDefined();
    expect(passedTask.turnUserId).toBe('u_hari');

    // Verify task state in store
    const state = taskStore.getTasks();
    const sharedTask = state.shared.find((t) => t.id === passedTask.id);
    expect(sharedTask).toBeDefined();
    expect(sharedTask?.turnNote).toContain('Hari');

    // Verify notification created
    const notifs = taskStore.getNotifications();
    const notif = notifs.find((n) => n.title.includes('Turn passed to Hari'));
    expect(notif).toBeDefined();
    expect(notif?.time).not.toBe('Just now');
    expect(notif?.time).toMatch(/(Today|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/);
    expect(notif?.timestamp).toBeGreaterThan(0);
  });

  it('Command 4: "what\'s my day?" parses QUERY_DAY intent without assigning tasks', () => {
    const input = "what's my day?";
    const parsed = parseCommand(input);

    expect(parsed.intent).toBe('QUERY_DAY');
    // Ensure no task state was mutated for a query command
    const state = taskStore.getTasks();
    expect(state.imChasing.some((t) => t.title === "what's my day?")).toBe(false);
    expect(state.iOwe.some((t) => t.title === "what's my day?")).toBe(false);
  });

  it('Notifications are created with the correct localized time and not hardcoded "Just now"', () => {
    taskStore.addNotification({
      title: "Test notification for time verification",
      type: "system",
      link: "/console",
    });

    const notifs = taskStore.getNotifications();
    const created = notifs.find((n) => n.title === "Test notification for time verification");
    expect(created).toBeDefined();
    expect(created?.time).not.toBe("Just now");
    expect(created?.time.startsWith("Today,")).toBe(true);
    expect(created?.time).toMatch(/\d{2}:\d{2}\s+(AM|PM)/);
    expect(created?.timestamp).toBeDefined();
  });
});
