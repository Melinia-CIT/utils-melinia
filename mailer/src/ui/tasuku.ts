import task from 'tasuku';

export async function runTasks(tasks: Parameters<typeof task.group>[0]): Promise<void> {
  await task.group(tasks);
}

export async function runTask<T>(title: string, fn: (ctx: any) => T | Promise<T>): Promise<T> {
  const result = await task(title, fn);
  return result as T;
}
