/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */

CampusExplorer.sendQuery = (query) => {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/query", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify(query));
        xhr.onload = () => {
            const res = JSON.parse(xhr.response);
            resolve(res);
        };
        xhr.onerror = () => {
            reject();
        }
    });
};
