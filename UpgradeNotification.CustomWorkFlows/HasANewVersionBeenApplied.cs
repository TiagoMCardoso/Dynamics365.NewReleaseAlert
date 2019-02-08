using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Workflow;
using System;
using System.Activities;
using UpgradeNotification.CustomWorkFlows.Logic;

namespace UpgradeNotification.CustomWorkFlows
{
    public class HasANewVersionBeenApplied : CodeActivity
    {
        public string className = "HasANewVersionBeenApplied";

        [Output("NewVersionNumber")]
        public OutArgument<string> NewVersionNumber { get; set; }

        /// <summary>
        /// Execute Method for Setting Rate Values
        /// </summary>
        /// <param name="executionContext"></param>
        protected override void Execute(CodeActivityContext executionContext)
        {
            // Create the tracing service
            ITracingService tracingService = executionContext.GetExtension<ITracingService>();

            // Create the context
            IWorkflowContext workflowContext = executionContext.GetExtension<IWorkflowContext>();
            IOrganizationServiceFactory serviceFactory = executionContext.GetExtension<IOrganizationServiceFactory>();
            IOrganizationService organizationService = serviceFactory.CreateOrganizationService(workflowContext.UserId);

            try
            {
                tracingService.Trace("{0} - Start", className);
                tracingService.Trace("{0} - Calling UpgradeNotificationLogic class", className);

                // Initialize Upgrade Notification Logic class
                UpgradeNotificationLogic upgradeNotificationLogic = new UpgradeNotificationLogic(organizationService, tracingService);

                // Check if There is a New Dynamics 365 version
                string newVersion = upgradeNotificationLogic.CheckIfThereIsANewVersion();

                tracingService.Trace("{0} - Called UpgradeNotificationLogic class", className);
                tracingService.Trace("{0} - New Release Version is {1}", className, (newVersion != string.Empty ? newVersion : "Same as before"));

                // Set new version number output variable
                NewVersionNumber.Set(executionContext, newVersion); 

                tracingService.Trace("{0} - End", className);
            }
            catch (InvalidWorkflowException ex)
            {
                tracingService.Trace("Error! Method: {0}; Exception: {1}; Message: {2}", ex.TargetSite, ex.InnerException, ex.Message);
                throw new InvalidWorkflowException(string.Format("Method: {0}; Exception: {1}; Message: {2}", ex.TargetSite, ex.InnerException, ex.Message));
            }
            catch (Exception ex)
            {
                tracingService.Trace("Error: {0}", ex.Message);
                throw;
            }
        }
    }
}