import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'chatapp-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092,localhost:29093,localhost:29094').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

export const producer = kafka.producer();

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected successfully');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
  }
};

export const disconnectProducer = async () => {
  await producer.disconnect();
};

export const publishEvent = async (topic, eventName, payload) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          key: eventName,
          value: JSON.stringify(payload)
        }
      ]
    });
  } catch (error) {
    console.error(`Failed to publish event ${eventName} to topic ${topic}:`, error);
  }
};

// Consumers will be instantiated by individual services
export const createConsumer = (groupId) => {
  return kafka.consumer({ groupId });
};
