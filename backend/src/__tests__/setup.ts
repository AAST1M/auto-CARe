import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import prisma from '../prismaClient';
import redisClient from '../redisClient';

// Mock Prisma
jest.mock('../prismaClient', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// Mock Redis
jest.mock('../redisClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    setEx: jest.fn(),
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    on: jest.fn(),
    connect: jest.fn(),
  },
  getCache: jest.fn(),
  setCache: jest.fn(),
  clearCache: jest.fn(),
}));

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
  jest.clearAllMocks();
});
