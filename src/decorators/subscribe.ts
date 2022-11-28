import {
  MessageHandlerOptions,
  QueueOptions,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { applyDecorators, Logger, SetMetadata } from '@nestjs/common';
import {
  ackErrorHandler,
  defaultNackErrorHandler,
} from '@golevelup/nestjs-rabbitmq/lib/amqp/errorBehaviors';
import { Channel, ConsumeMessage } from 'amqplib';
import { RmqExchangeUtil } from '../rmq-exchange.util';
import { Event } from '../event';
import { Decorators, SubscriptionOptions, SubscriptionOptionsWithDefaults } from './interfaces';

export const RABBIT_RETRY_HANDLER = 'RABBIT_RETRY_HANDLER';

export function Subscribe(
  event: Event<unknown>,
  queueName: string,
  options: SubscriptionOptions,
): Decorators {
  const subscriptionOptions: SubscriptionOptionsWithDefaults = {
    requeueOnError: {
      enabled: true,
      initialDelayInMs: 20_000,
      maxRetries: 5,
      backoffMultiplier: 2,
      ...options.requeueOnError
    },
    exchange: options.exchange,
    autoDelete: options.autoDelete ?? false,
    durable: options.durable ?? true
  };

  const routingKey = event.getRoutingKey();
  const queueSpecificRoutingKey = `${queueName}-${routingKey}`;
  const fullQueueName = `${queueName}-${subscriptionOptions.exchange}_${routingKey}`;

  const queueOptions: QueueOptions = {
    durable: subscriptionOptions.durable,
    autoDelete: subscriptionOptions.autoDelete,
    arguments: subscriptionOptions.requeueOnError.enabled
      ? {
          'x-dead-letter-exchange': RmqExchangeUtil.getDeadLetterExchangeName(
            subscriptionOptions.exchange,
          ),
          'x-dead-letter-routing-key': queueSpecificRoutingKey,
        }
      : {},
  };
  const baseMessageHandlerOptions: MessageHandlerOptions = {
    createQueueIfNotExists: true,
    queue: fullQueueName,
    errorHandler: createErrorHandler(
      queueSpecificRoutingKey,
      subscriptionOptions,
      subscriptionOptions.exchange,
      event.getOptions().isSensitive,
    ),
    queueOptions,
  };

  const decorators: MethodDecorator[] = [];

  decorators.push(
    RabbitSubscribe({
      exchange: subscriptionOptions.exchange,
      routingKey: routingKey,
      ...baseMessageHandlerOptions,
    }),
  );

  if (subscriptionOptions.requeueOnError.enabled) {
    decorators.push(
      SetMetadata(RABBIT_RETRY_HANDLER, {
        type: 'subscribe',
        routingKey: queueSpecificRoutingKey,
        exchange: RmqExchangeUtil.getRetryExchangeName(
          subscriptionOptions.exchange,
        ),
        ...baseMessageHandlerOptions,
      }),
    );
  }

  return applyDecorators(...decorators);
}

function createErrorHandler(
  queueSpecificRoutingKey: string,
  options: SubscriptionOptionsWithDefaults,
  exchange: string,
  isSensitive: boolean,
): (
  channel: Channel,
  msg: ConsumeMessage,
  error: unknown,
) => void | Promise<void> {
  return (channel: Channel, msg: ConsumeMessage, error) => {
    const messageHeaders = msg.properties.headers;
    const retryAttempt: number = messageHeaders['x-retry'] ?? 0;

    Logger.error({
      message: `Event handling failed for routing key "${queueSpecificRoutingKey}"`,
      payload: isSensitive ? msg.content.toString() : undefined,
      error,
      requeue: options.requeueOnError.enabled,
      retryAttempt,
    });

    if (options.requeueOnError.enabled) {
      const delay: number =
        messageHeaders['x-delay'] ?? options.requeueOnError.initialDelayInMs / options.requeueOnError.backoffMultiplier;

      if (retryAttempt < options.requeueOnError.maxRetries) {
        const retryHeaders = {
          ...messageHeaders,
          'x-delay': delay * options.requeueOnError.backoffMultiplier,
          'x-retry': retryAttempt + 1,
          'event-id': messageHeaders['event-id'],
        };

        channel.publish(
          RmqExchangeUtil.getRetryExchangeName(exchange),
          queueSpecificRoutingKey,
          msg.content,
          {
            headers: retryHeaders,
          },
        );
      } else {
        return pushToDeadLetterQueue(channel, msg, error);
      }
    }

    return ackErrorHandler(channel, msg, error);
  };
}

function pushToDeadLetterQueue(
  channel: Channel,
  msg: ConsumeMessage,
  error,
): void | Promise<void> {
  return defaultNackErrorHandler(channel, msg, error);
}
