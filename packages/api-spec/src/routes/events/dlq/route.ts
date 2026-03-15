import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import {
  dlqMessagesResponseSchema,
  redriveRequestSchema,
  redriveResponseSchema,
  redriveSingleRequestSchema,
} from '../../../event-admin-schemas'

export const eventErrorSchema = z.object({
  code: z.string(),
  error: z.string(),
})

export const getDlqMessagesRoute = createRoute({
  method: 'get',
  path: '/dlq/messages',
  request: {
    query: z.object({ queueName: z.string() }),
  },
  responses: {
    200: {
      description: 'DLQ messages',
      content: {
        'application/json': {
          schema: dlqMessagesResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid queue name',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    404: {
      description: 'Queue not found',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
  },
})

export const redriveAllRoute = createRoute({
  method: 'post',
  path: '/dlq/redrive',
  request: {
    body: {
      content: {
        'application/json': {
          schema: redriveRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'DLQ messages redriven',
      content: {
        'application/json': {
          schema: redriveResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid queue name',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    404: {
      description: 'Queue not found',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
  },
})

export const redriveSingleRoute = createRoute({
  method: 'post',
  path: '/dlq/redrive/{messageId}',
  request: {
    params: z.object({ messageId: z.string() }),
    body: {
      content: {
        'application/json': {
          schema: redriveSingleRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Single DLQ message redriven',
      content: {
        'application/json': {
          schema: redriveResponseSchema,
        },
      },
    },
    400: {
      description: 'Invalid queue name',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    401: {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
    404: {
      description: 'Queue or message not found',
      content: {
        'application/json': {
          schema: eventErrorSchema,
        },
      },
    },
  },
})
