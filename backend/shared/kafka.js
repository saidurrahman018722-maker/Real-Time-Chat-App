const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'chatapp-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092,localhost:29093,localhost:29094').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const producer = kafka.producer();

const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('Kafka Producer connected successfully');
  } catch (error) {
    console.error('Failed to connect Kafka Producer:', error);
  }
};

const disconnectProducer = async () => {
  await producer.disconnect();
};

const publishEvent = async (topic, eventName, payload) => {
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
const createConsumer = (groupId) => {
  return kafka.consumer({ groupId });
};

module.exports = {
  kafka,
  producer,
  connectProducer,
  disconnectProducer,
  publishEvent,
  createConsumer
};
