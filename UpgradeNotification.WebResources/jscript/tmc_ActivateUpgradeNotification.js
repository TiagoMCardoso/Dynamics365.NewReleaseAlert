if (typeof (UpgradeNotification) == "undefined") { UpgradeNotification = { __namespace: true }; }

UpgradeNotification.APIVersion = "v9.1";
UpgradeNotification.ClientURL = Xrm.Page.context.getClientUrl();
UpgradeNotification.WebAPI = UpgradeNotification.ClientURL + "/api/data/" + UpgradeNotification.APIVersion;

// OnLoad
UpgradeNotification.CheckIfFirstUpgradeHistoryIsAlreadyCreated = function () {
    var query = encodeURI(UpgradeNotification.WebAPI +
        "/tmc_upgradehistories?$select=tmc_versionnumber&$filter=startswith(tmc_versionnumber,'1.0.0.0')");

    var req = new XMLHttpRequest();
    req.open("GET", query, false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {
        if (this.readyState == 4 /* complete */) {
            req.onreadystatechange = null;
            if (this.status == 200)//to verify result is OK
            {
                // Get response
                var data = JSON.parse(this.response);

                // Check if an existing Upgrade History record was found
                if (data.value != null && data.value.length > 0) {
                    // Disable Activation button
                    UpgradeNotification.FirstUpgradeHistoryIsAlreadyCreated(true);
                }
                else {
                    // Enable Activation button
                    UpgradeNotification.FirstUpgradeHistoryIsAlreadyCreated(false);
                }
            }
            else {
                var error = JSON.parse(this.response).error;
                UpgradeNotification.Error(error.message);
            }
        }
    };
    req.send(null);
},

// OnClick
UpgradeNotification.ActiveUpgradeNotificationOnClick = function () {
    // Disable Elements
    UpgradeNotification.EnableDisableElements(false);

    // Create the first Upgrade History record
    UpgradeNotification.CreateUpgradeHistory();

    // Enable Elements
    UpgradeNotification.EnableDisableElements(true);
},

// #1
UpgradeNotification.CreateUpgradeHistory = function () {
    var upgradeHistory = {};
    upgradeHistory["tmc_versionnumber"] = "1.0.0.0 [DON'T DELETE]";

    var id = null;
    var req = new XMLHttpRequest();
    req.open("POST", encodeURI(UpgradeNotification.WebAPI + "/tmc_upgradehistories"), false);
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.send(JSON.stringify(upgradeHistory));

    if (req.readyState === 4) {
        if (req.status === 204) {
            // Get ID from the response
            var uri = req.getResponseHeader("OData-EntityId");
            var regExp = /\(([^)]+)\)/;
            var matches = regExp.exec(uri);
            id = matches[1];

            // Get Check and Notify Release Workflow Id
            UpgradeNotification.GetCheckAndNotifyReleasesWorkflow(id);
        }
        else {
            var error = JSON.parse(req.response).error;
            UpgradeNotification.Error(error.message);
        }
    }
},

// #2
UpgradeNotification.GetCheckAndNotifyReleasesWorkflow = function (id) {

    var workflowName = "Upgrade Notification - Check and Notify new releases";

    var query = encodeURI(UpgradeNotification.WebAPI +
        "/workflows?$select=workflowid&$filter=name eq '" + workflowName + "' and type eq 1 and rendererobjecttypecode eq null and category eq 0");

    var req = new XMLHttpRequest();
    req.open("GET", query, false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.onreadystatechange = function () {
        if (this.readyState == 4 /* complete */) {
            req.onreadystatechange = null;
            if (this.status == 200)//to verify result is OK
            {
                var data = JSON.parse(this.response);

                // Check if an existing Upgrade History record was found
                if (data.value != null && data.value.length > 0) {
                    var workflow = data.value[0];

                    // Call Check and Notify Release Workflow
                    UpgradeNotification.CallUpgradeNotificationWorkflow(id, workflow.workflowid);
                }
                else {
                    var error = "Workflow not found";
                    UpgradeNotification.Error(error.message);
                }
            }
            else {
                var error = JSON.parse(this.response).error;
                UpgradeNotification.Error(error.message);
            }
        }
    };
    req.send(null);
},

// #3
UpgradeNotification.CallUpgradeNotificationWorkflow = function (id, workflowId) {

    //Define the query to execute the action
    query = "workflows(" + workflowId.replace("}", "").replace("{", "") + ")/Microsoft.Dynamics.CRM.ExecuteWorkflow";

    var data = {
        "EntityId": id
    };

    //Create request
    var req1 = new XMLHttpRequest();
    req1.open("POST", encodeURI(UpgradeNotification.WebAPI + "/" + query), false);
    req1.setRequestHeader("Accept", "application/json");
    req1.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req1.setRequestHeader("OData-MaxVersion", "4.0");
    req1.setRequestHeader("OData-Version", "4.0");

    req1.onreadystatechange = function () {

        if (this.readyState == 4 /* complete */) {
            req1.onreadystatechange = null;

            if (this.status == 200) {
                // Deactivate the first upgrade history record
                UpgradeNotification.DeactivateUpgradeHistory(id);
            } else {
                //error callback
                var error = JSON.parse(req1.response).error;
                UpgradeNotification.Error(error.message);
            }
        }
    };
    req1.send(JSON.stringify(data));
},

// #4
UpgradeNotification.DeactivateUpgradeHistory = function (id) {
    var req2 = new XMLHttpRequest();
    var query = "tmc_upgradehistories(" + id + ")/statecode";
    req2.open("PUT", encodeURI(UpgradeNotification.WebAPI + "/" + query), false);
    req2.setRequestHeader("Accept", "application/json");
    req2.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req2.setRequestHeader("OData-MaxVersion", "4.0");
    req2.setRequestHeader("OData-Version", "4.0");
    req2.onreadystatechange = function () {
        if (this.readyState == 4 /* complete */) {
            req2.onreadystatechange = null;
            if (this.status == 204) {// status 204
                // Disable Activation button
                UpgradeNotification.FirstUpgradeHistoryIsAlreadyCreated(true);
            }
            else {
                //error callback
                var error = JSON.parse(req2.response).error;
                UpgradeNotification.Error(error.message);
            }
        }
    };
    req2.send(JSON.stringify({ value: 1 })); // must the property "value" have to be used
},

UpgradeNotification.FirstUpgradeHistoryIsAlreadyCreated = function (created) {
    // Check if an existing Upgrade History record was found
    if (created) {
        $(".container").hide();
        $("#firstNotificationHistoryAlreadyCreated").show();
    }
    else {
        $(".container").show();
        $("#firstNotificationHistoryAlreadyCreated").hide();
    }
},

UpgradeNotification.Error = function (message) {
    try {
        // Show error messsage box
        $("#errorBox").show();

        // Append new error message into the current value
        $("#errorMessage").html($("#errorMessage").html() + message + "<br/>");

        // Enable Elements
        UpgradeNotification.EnableDisableElements(true);
    } catch (error) {
        UpgradeNotification.Error(error, null);
    }
},

UpgradeNotification.EnableDisableElements = function (enable) {
    if (enable) {
        // Enable Activate button
        $("#btnActivate").removeAttr("disabled");

        // Hide Loader
        $("#processing").hide();
    }
    else {
        // Disable Activate button
        $("#btnActivate").attr("disabled", true);

        // Show Loader
        $("#processing").show();
    }
}