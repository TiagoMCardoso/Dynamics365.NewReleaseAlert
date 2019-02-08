using Microsoft.Crm.Sdk.Messages;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Client;
using System.Linq;

namespace UpgradeNotification.CustomWorkFlows.Logic
{
    public class UpgradeNotificationLogic
    {
        string className = "UpgradeNotificationLogic";
        ITracingService TracingService;
        IOrganizationService OrganizationService;
        OrganizationServiceContext orgContext;

        public UpgradeNotificationLogic(IOrganizationService organizationService, ITracingService tracingService)
        {
            OrganizationService = organizationService;
            TracingService = tracingService;
            orgContext = new OrganizationServiceContext(organizationService);
        }

        public string CheckIfThereIsANewVersion()
        {
            TracingService.Trace("{0} - Inside CheckIfThereIsANewVersion", className);

            string currentVersion = string.Empty;
            string lastVersion = string.Empty;

            // Get Dynamics 365 current version
            currentVersion = GetCurrentVersion();

            // Get Dynamics 365 last version stored
            lastVersion = GetLastVersionStored();

            TracingService.Trace("{0} - Leaving CheckIfThereIsANewVersion", className);

            if (currentVersion != string.Empty && lastVersion != string.Empty && currentVersion != lastVersion)
            {
                return currentVersion;
            }
            else if (lastVersion == string.Empty)
            {
                return currentVersion;
            }
            else
            {
                return string.Empty;
            }
        }

        private string GetCurrentVersion()
        {
            TracingService.Trace("{0} - Inside GetCurrentVersion", className);

            string currentVersion = string.Empty;

            RetrieveVersionRequest request = new RetrieveVersionRequest();

            TracingService.Trace("{0} - Retrieving Current Dynamics Version Number", className);

            RetrieveVersionResponse response = (RetrieveVersionResponse)OrganizationService.Execute(request);

            TracingService.Trace("{0} - Retrived Current Dynamics Version Number", className);

            if (response != null && response.Results != null && response.Results.Count > 0)
            {
                currentVersion = response.Version;
            }

            TracingService.Trace("{0} - Current Version Number is {1}", className, currentVersion);
            TracingService.Trace("{0} - Leaving GetCurrentVersion", className);

            return currentVersion;
        }

        private string GetLastVersionStored()
        {
            TracingService.Trace("{0} - Inside GetLastVersionStored", className);

            string version = string.Empty;

            TracingService.Trace("{0} - Retrieving Last Upgrade History Record", className);

            // Retrieve last Upgrade Version Number
            var upgradeNotification = (from upgradeN in orgContext.CreateQuery("tmc_upgradehistory")
                                       where ((OptionSetValue)upgradeN["statecode"]).Value == 0 // Active Only
                                       orderby upgradeN["createdon"] descending
                                       select upgradeN["tmc_versionnumber"]).FirstOrDefault();

            TracingService.Trace("{0} - Retrieved Last Upgrade History Record", className);

            // Check if there is an upgrade notification record
            if (upgradeNotification != null)
            {
                version = upgradeNotification.ToString();
            }

            TracingService.Trace("{0} - Version Number is {1}", className, version);
            TracingService.Trace("{0} - Leaving GetLastVersionStored", className);

            return version;
        }
    }
}
