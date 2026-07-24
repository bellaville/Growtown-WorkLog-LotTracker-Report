function doGet(e) {

    var workOrderId = e.parameter.paramKey;
    const queryWO = '"' + workOrderId + '";';

    const workOrderQuery = runQuery(queryWO, QUERIES.work_order);

    return HtmlService.createHtmlOutput("<h3>Report for Work Order: " + workOrderId + "<br> operator: " + workOrderQuery.operator + "</h3>");

}

function runQuery(workOrder, query) {
    const projectId = 'golden-memory-498115-q3';
    const request = {
        query: query + workOrder,
        useLegacySql: false
    };

    let queryResults = BigQuery.Jobs.query(request, projectId);
    const jobId = queryResults.jobReference.jobId;

    // Check on status of the Query Job.
    let sleepTimeMs = 500;
    while (!queryResults.jobComplete) {
        Utilities.sleep(sleepTimeMs);
        sleepTimeMs *= 2;
        queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId);
    }

    // Get all the rows of results.
    let rows = queryResults.rows;
    while (queryResults.pageToken) {
        queryResults = BigQuery.Jobs.getQueryResults(projectId, jobId, {
            pageToken: queryResults.pageToken,
        });
        rows = rows.concat(queryResults.rows);
    }

    if (!rows) {
        console.log("No rows returned.");
        return false;
    }

    const result = {
        "Operator" : rows[0].f[1].v,
        "Timestamp" : rows[0].f[2].v,
        "Recorded Date" : rows[0].f[3].v,
        "Subject" : rows[0].f[4].v,
        "Operation" : rows[0].f[5].v,
        "Category" : rows[0].f[6].v,
        "Operation Detail" : rows[0].f[7].v,
        "Total Input Weight" : rows[0].f[8].v,
        "Total Cannabis" :  rows[0].f[9].v,
        "Total Non-Cannabis" :  rows[0].f[10].v,
        "Total Output Weight" :  rows[0].f[11].v

    }

    
    return result;

}
