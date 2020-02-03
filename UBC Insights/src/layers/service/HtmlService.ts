export default class HtmlService {
    private parse5 = require("parse5");
    public parse(htmlText: string): Document {
        return this.parse5.parse(htmlText);
    }
}
