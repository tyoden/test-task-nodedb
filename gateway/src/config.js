
const {
    INCOME_QUEUE,
    OUTCOME_QUEUE,
    PORT,
    MESSENGER_URL
} = process.env;



/**
 * @name config
 */
export default {
    server: {
        port: PORT || 3000
    },
    messenger: {
        url: MESSENGER_URL || "amqp://localhost",
        INCOME_QUEUE,
        OUTCOME_QUEUE
    }
};