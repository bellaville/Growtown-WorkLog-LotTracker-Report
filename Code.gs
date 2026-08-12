/**
 * HYPERLINK(CONCAT("https://script.google.com/a/macros/growtown.ca/s/AKfycbz9FCiFhrl8g5F_QjziomrA8x4CSNuCXF31f15mAJJm/dev?paramKey=", work_order), work_order)
 * 
 * Web app returned by clicking the link above from the Growtown Lot Tracker Report.
 */
function doGet(e) {

    var workOrderId = e.parameter.paramKey;
    const queryWO = '"' + workOrderId + '";';

    const workOrderQuery = runQuery(queryWO, QUERIES.work_order, 'WO') || [];
    const inputQuery = runQuery(queryWO, QUERIES.inputs, 'IP') || [];
    console.log(inputQuery);
    const outputQuery = runQuery(queryWO, QUERIES.outputs, 'OP') || [];
    console.log(outputQuery);

    const template = HtmlService.createTemplateFromFile('WorkOrderReport');
    template.workOrderId = workOrderId;
    template.workOrder = workOrderQuery;
    template.inputs = inputQuery;
    template.outputs = outputQuery;

    return template.evaluate().setTitle('Work Order Report: ' + workOrderId);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename).getContent();
}


/**
 * Run a query to Big Query for a specific work order, query, and step (workorder, inputs, outputs)
 */
function runQuery(workOrder, query, step) {
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

    if (step == 'WO') {
        return getWorkOrderResult(rows);
    } else if (step == 'IP') {
        return getInputResult(rows);
    } else if (step == 'OP') {
        return getOutputResult(rows)
    } else
        return false;

}

function getTimeStamp(rawTimestamp) {
    let formattedTimestamp = "N/A";
    if (rawTimestamp) {
        const epochMillis = Number(rawTimestamp) * 1000;
        const dateObject = new Date(epochMillis);

        formattedTimestamp = Utilities.formatDate(dateObject, "EDT", "yyyy-MM-dd HH:mm:ss");
    }
    return formattedTimestamp;
}

function getWorkOrderResult(rows) {

    const result = {
        "Operator": rows[0].f[1].v,
        "Email": rows[0].f[2].v,
        "Timestamp": getTimeStamp(rows[0].f[3].v),
        "Recorded_Date": rows[0].f[4].v,
        "Subject": rows[0].f[5].v || "none",
        "Operation": rows[0].f[6].v,
        "Category": rows[0].f[7].v || "none",
        "Operation_Detail": rows[0].f[8].v || "none",
        "Total_Input_Weight": rows[0].f[9].v,
        "Total_Cannabis": rows[0].f[10].v,
        "Total_Non_Cannabis": rows[0].f[11].v,
        "Total_Output_Weight": rows[0].f[12].v || "none",
        "Total_Usable": rows[0].f[13].v || "none",
        "Total_Processing_Loss": rows[0].f[14].v || "none",
        "Total_Destruction_Weight": rows[0].f[15].v || "none",
        "Status": rows[0].f[16].v,
        "Notes": rows[0].f[17].v
    }

    return result;
}

function getInputResult(rows) {
    // 1. Define the exact order of columns from your BigQuery SELECT statement
    const columns = [
        'Input_ID',
        'Type',
        'Input_Lot',
        'NC_Input_Lot',
        'Receiving_Lot',
        'Input_Weight',
        'What',
        'WO_ID',
        'Pushed'
    ];

    // 2. Handle empty or null result sets safely
    if (!rows || rows.length === 0) {
        return [];
    }

    // 3. Map the nested row structure into clean objects
    return rows.map(row => {
        const item = {};

        columns.forEach((colName, index) => {
            // Safely access the value property inside BigQuery's field array
            const rawValue = row.f[index] ? row.f[index].v : null;

            // Assign the value to the corresponding object property
            item[colName] = rawValue;
        });

        return item;
    });
}

function getOutputResult(rows) {


    // 1. Define the exact order of columns from your BigQuery SELECT statement
    const columns = [
        'Output_ID',
        'Output_Lot',
        'Going_To',
        'Output_Weight',
        'What',
        'Loss',
        'Dest',
        'WO_ID',
        'Pushed'
    ];

    // 2. Handle empty or null result sets safely
    if (!rows || rows.length === 0) {
        return [];
    }

    // 3. Map the nested row structure into clean objects
    return rows.map(row => {
        const item = {};

        columns.forEach((colName, index) => {
            // Safely access the value property inside BigQuery's field array
            const rawValue = row.f[index] ? row.f[index].v : null;

            // Assign the value to the corresponding object property
            item[colName] = rawValue;
        });

        return item;
    });


}