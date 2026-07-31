import { Queue, Worker, Job } from 'bullmq';
import { env } from '../config';

const connection = {
  host: env.REDIS_HOST || process.env.REDIS_HOST || 'localhost',
  port: parseInt(env.REDIS_PORT || process.env.REDIS_PORT || '6379'),
  password: env.REDIS_PASSWORD || process.env.REDIS_PASSWORD
};

export const recruitmentQueue = new Queue('recruitment-queue', { connection });

// Initialize the worker to process recruitment background jobs
export const recruitmentWorker = new Worker(
  'recruitment-queue',
  async (job: Job) => {
    switch (job.name) {
      case 'process-resume':
        console.log('Processing resume for candidate...', job.data.candidateId);
        // Integrate AI resume parsing here
        break;
      case 'generate-offer-letter':
        console.log('Generating offer letter PDF for...', job.data.offerId);
        // PDF generation logic here
        break;
      case 'send-interview-reminder':
        console.log('Sending interview reminder for...', job.data.interviewId);
        // Email integration logic here
        break;
      default:
        console.warn(`Unknown job name: ${job.name}`);
    }
  },
  { connection }
);

recruitmentWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

recruitmentWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} has failed with ${err.message}`);
});
