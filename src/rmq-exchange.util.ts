import { Injectable } from '@nestjs/common';
import { RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RmqExchangeUtil {
  public static createExchanges(
    exchanges: RabbitMQExchangeConfig[],
  ): RabbitMQExchangeConfig[] {
    return exchanges.flatMap((exchange: RabbitMQExchangeConfig) => {
      const retryExchange: RabbitMQExchangeConfig = {
        name: RmqExchangeUtil.getRetryExchangeName(exchange.name),
        type: 'x-delayed-message',
        options: {
          arguments: {
            'x-delayed-type': 'direct',
          },
        },
      };
      const deadLetterExchange: RabbitMQExchangeConfig = {
        name: RmqExchangeUtil.getDeadLetterExchangeName(exchange.name),
        type: 'direct',
      };

      return [exchange, retryExchange, deadLetterExchange];
    });
  }

  public static getRetryExchangeName(exchange: string): string {
    return `${exchange}.retry`;
  }

  public static getDeadLetterExchangeName(exchange: string): string {
    return `${exchange}.dead`;
  }

  public static getDeadLetterQueueName(queueName: string): string {
    return `${queueName}.dead`;
  }
}
