import { Injectable } from '@nestjs/common';
import { RabbitMQExchange } from './rmq.interfaces';
import { RabbitMQExchangeConfig } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class RmqExchangeUtil {
  public static createExchanges(
    exchanges: RabbitMQExchange[],
  ): RabbitMQExchangeConfig[] {
    return exchanges.flatMap((exchange: RabbitMQExchange) => {
      const exchangesToCreate: RabbitMQExchangeConfig[] = [exchange]

      if (exchange.initRetryExchange === undefined || exchange.initRetryExchange) {
        const retryExchange: RabbitMQExchangeConfig = {
          name: RmqExchangeUtil.getRetryExchangeName(exchange.name),
          type: 'x-delayed-message',
          options: {
            arguments: {
              'x-delayed-type': 'direct',
            },
          },
        };

        exchangesToCreate.push(retryExchange)
      }

      if (exchange.initDeadLetterExchange === undefined || exchange.initDeadLetterExchange) {
        const deadLetterExchange: RabbitMQExchangeConfig = {
          name: RmqExchangeUtil.getDeadLetterExchangeName(exchange.name),
          type: 'direct',
        };

        exchangesToCreate.push(deadLetterExchange)
      }


      return exchangesToCreate
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
