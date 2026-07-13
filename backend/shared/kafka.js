import { Kafka, Partitioners } from 'kafkajs';

export const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID || 'chatapp-client',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:29092,localhost:29093,localhost:29094').split(','),
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

export const producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });

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

export const initKafkaTopics = async (topics) => {
  try {
    const admin = kafka.admin();
    await admin.connect();
    const existingTopics = await admin.listTopics();
    const topicsToCreate = topics.filter(topic => !existingTopics.includes(topic));
    
    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate.map(topic => ({ topic, numPartitions: 3 }))
      });
      console.log('Kafka Topics automatically created:', topicsToCreate);
    }
    await admin.disconnect();
  } catch (error) {
    console.error('Kafka Topic initialization error:', error.message);
  }
};

// Consumers will be instantiated by individual services
export const createConsumer = (groupId) => {
  return kafka.consumer({ groupId });
};
