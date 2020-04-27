import RequestBuilder from "./requestBuilder";
import ResponseParser from "./responseParser";

export default Object.freeze({
    parser: new ResponseParser(),
    builder: new RequestBuilder()
});