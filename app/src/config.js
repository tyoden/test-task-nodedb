import path from 'path';

const {
    MESSENGER_URL,
    INCOME_QUEUE,
    OUTCOME_QUEUE,
    DATA_DIR
} = process.env;


const root = path.resolve(__dirname, '..');
const dataDir = DATA_DIR || path.join(root, 'data');

/**
 * @name config
 */
export default {
    messenger: {
        rabbitMQ: {
            url: MESSENGER_URL,
            io: {
                INCOME_QUEUE,
                OUTCOME_QUEUE
            }
        }
    },
    storage: {
        dir: dataDir
    }
};