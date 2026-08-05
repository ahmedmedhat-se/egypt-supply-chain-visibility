import { AsyncLocalStorage } from 'node:async_hooks';
import type { FastifyRequest } from 'fastify';

export interface RequestContextStore {
  request: FastifyRequest;
}

const store = new AsyncLocalStorage<RequestContextStore>();

export const RequestContext = {
  run<T>(request: FastifyRequest, callback: () => T): T {
    return store.run({ request }, callback);
  },
  getRequest(): FastifyRequest | undefined {
    return store.getStore()?.request;
  },
};
