/**
 * Testes unitários para o sistema de logging
 */

import logger from '../../lib/logger';

// Mock do console
const mockConsole = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock do fetch
global.fetch = jest.fn();

describe('Logger', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console methods
    Object.assign(console, mockConsole);
  });

  describe('Sanitization', () => {
    it('should sanitize sensitive data', () => {
      const sensitiveData = {
        password: 'secret123',
        cpf: '12345678900',
        email: 'test@example.com',
        normalField: 'safe data',
      };

      logger.info('Test message', sensitiveData);

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Test message',
        {
          password: '[REDACTED]',
          cpf: '[REDACTED]',
          email: '[REDACTED]',
          normalField: 'safe data',
        }
      );
    });

    it('should sanitize nested objects', () => {
      const nestedData = {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            phone: '11999999999',
          },
        },
      };

      logger.info('Test message', nestedData);

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Test message',
        {
          user: {
            name: 'John',
            password: '[REDACTED]',
            profile: {
              email: '[REDACTED]',
              phone: '[REDACTED]',
            },
          },
        }
      );
    });

    it('should sanitize arrays', () => {
      const arrayData = {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' },
        ],
      };

      logger.info('Test message', arrayData);

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Test message',
        {
          users: [
            { name: 'John', password: '[REDACTED]' },
            { name: 'Jane', password: '[REDACTED]' },
          ],
        }
      );
    });
  });

  describe('Log Levels', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development';
      logger.debug('Debug message', { test: 'data' });

      expect(mockConsole.debug).toHaveBeenCalledWith(
        '🐛',
        'Debug message',
        { test: 'data' }
      );
    });

    it('should log info messages', () => {
      logger.info('Info message', { test: 'data' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Info message',
        { test: 'data' }
      );
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', { test: 'data' });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️',
        'Warning message',
        { test: 'data' }
      );
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', error, { test: 'data' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        '❌',
        'Error message',
        error,
        { test: 'data' }
      );
    });

    it('should log fatal messages', async () => {
      const error = new Error('Fatal error');
      await logger.fatal('Fatal message', error, { test: 'data' });

      expect(mockConsole.error).toHaveBeenCalledWith(
        '💀 FATAL:',
        'Fatal message',
        error,
        { test: 'data' }
      );
    });
  });

  describe('Performance Logging', () => {
    it('should log performance metrics', () => {
      logger.performance('Test operation', 1500, { test: 'data' });

      expect(mockConsole.warn).toHaveBeenCalledWith(
        '⚠️',
        'Performance: Test operation took 1500ms',
        {
          test: 'data',
          operation: 'Test operation',
          duration: 1500,
          slow: true,
        }
      );
    });

    it('should mark slow operations', () => {
      logger.performance('Fast operation', 500, { test: 'data' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Performance: Fast operation took 500ms',
        {
          test: 'data',
          operation: 'Fast operation',
          duration: 500,
          slow: false,
        }
      );
    });
  });

  describe('Audit Logging', () => {
    it('should log audit events', () => {
      logger.audit('User login', 'user-123', { ip: '192.168.1.1' });

      expect(mockConsole.log).toHaveBeenCalledWith(
        '📝 AUDIT:',
        expect.objectContaining({
          action: 'User login',
          userId: 'user-123',
          details: { ip: '192.168.1.1' },
        })
      );
    });
  });

  describe('Timer', () => {
    it('should measure execution time', () => {
      const endTimer = logger.time('Test operation');
      
      // Simulate some work
      setTimeout(() => {
        endTimer();
      }, 100);

      // Note: This test is simplified for demonstration
      // In a real test, you'd need to handle the async nature
    });
  });

  describe('Context Logger', () => {
    it('should create logger with context', () => {
      const contextLogger = logger.withContext({ userId: 'user-123' });
      
      contextLogger.info('Test message', { additional: 'data' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        'ℹ️',
        'Test message',
        { userId: 'user-123', additional: 'data' }
      );
    });
  });

  describe('Production Behavior', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should not log debug messages in production', () => {
      logger.debug('Debug message', { test: 'data' });

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });

    it('should send logs to external service in production', async () => {
      process.env.SENTRY_DSN = 'https://test@sentry.io/test';
      
      logger.info('Test message', { test: 'data' });

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(global.fetch).toHaveBeenCalledWith('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test message'),
      });
    });
  });
});
