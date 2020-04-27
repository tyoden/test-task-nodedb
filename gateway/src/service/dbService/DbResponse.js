export default class DbResponse {
    id;

    status;

    data;

    constructor(id, status, data) {
        this.id = id;
        this.status = status;
        this.data = data;
    }

    /**
     * @type {{Ok: Symbol, Fail: Symbol, NotFound: Symbol}}
     */
    static Status = Object.freeze({
        Ok: Symbol('ok'),
        Fail: Symbol('fail'),
        NotFound: Symbol('not found')
    });

}