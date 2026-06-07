// logger.ts
export class LocalStorageLogger {
  private static readonly STORAGE_KEY = 'console_logs';
  private static readonly MAX_LOGS = 1000;

  static log(...args: any[]) {
    const logs = this.getLogs();
    logs.push({
      type: 'log',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    this.saveLogs(logs);
  }

  static warn(...args: any[]) {
    const logs = this.getLogs();
    logs.push({
      type: 'warn',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    this.saveLogs(logs);
  }

  static error(...args: any[]) {
    const logs = this.getLogs();
    logs.push({
      type: 'error',
      message: args.join(' '),
      timestamp: new Date().toISOString()
    });
    this.saveLogs(logs);
  }

  private static getLogs() {
    const logs = localStorage.getItem(this.STORAGE_KEY);
    return logs ? JSON.parse(logs) : [];
  }

  private static saveLogs(logs: any[]) {
    // 限制日志数量
    if (logs.length > this.MAX_LOGS) {
      logs = logs.slice(-this.MAX_LOGS);
    }
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
  }

  static export() {
    const logs = this.getLogs();
    const content = logs.map(log => 
      `[${log.timestamp}] [${log.type}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static clear() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

export class SimpleLogger {
  private static logs: string[] = [];
  private static originalConsole = { ...console };

  static init() {
    // 重写 console 方法
    console.log = (...args) => {
      SimpleLogger.originalConsole.log(...args);
      SimpleLogger.logs.push(`[LOG] ${args.join(' ')}`);
    };

    console.warn = (...args) => {
      SimpleLogger.originalConsole.warn(...args);
      SimpleLogger.logs.push(`[WARN] ${args.join(' ')}`);
    };

    console.error = (...args) => {
      SimpleLogger.originalConsole.error(...args);
      SimpleLogger.logs.push(`[ERROR] ${args.join(' ')}`);
    };

    console.group = (...args) => {
      SimpleLogger.originalConsole.group(...args);
      SimpleLogger.logs.push(`[GROUP] ${args.join(' ')}`);
    };

    console.groupEnd = () => {
      SimpleLogger.originalConsole.groupEnd();
      SimpleLogger.logs.push('[GROUP_END]');
    };
  }

  static save() {
    const blob = new Blob([SimpleLogger.logs.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  static clear() {
    SimpleLogger.logs = [];
  }
}

// 在 utils.ts 中使用
export function printValidationResult(result: ValidationResult): void {
  // 使用 LocalStorageLogger 记录日志
  LocalStorageLogger.log('开始验证单元格关系数据');
  
  if (!result.isValid) {
    LocalStorageLogger.error('数据校验未通过', result);
  }
  
  // 导出日志
  LocalStorageLogger.export();
}
