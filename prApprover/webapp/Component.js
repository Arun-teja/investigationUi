sap.ui.define(
  [
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "com/pr/prApprover/model/models",
  ],
  function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend(
      "com.pr.prApprover.Component",
      {
        metadata: {
          manifest: "json",
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
          // call the base component's init function
          UIComponent.prototype.init.apply(this, arguments);

          // enable routing
          this.getRouter().initialize();

          // set the device model
          this.setModel(models.createDeviceModel(), "device");

          this.setTaskModels();

          this.getInboxAPI().addAction(
            {
              action: "APPROVE",
              label: "Approve",
              type: "accept", // (Optional property) Define for positive appearance
            },
            function () {
				var that = this;
				var oDialog = new sap.m.Dialog({
					title: 'Approval',
					type: 'Message',
					content: [
						new sap.m.Label({
							text: 'Kindly enter the reason of approval (optional).',
							labelFor: 'submitDialogTextarea'
						}),
						new sap.m.TextArea('submitDialogTextarea', {
							liveChange: function (oEvent) {
								var sText = oEvent.getParameter('value');
								var parent = oEvent.getSource().getParent();
								parent.getBeginButton().setEnabled(sText.length > 0);
							},
							width: '100%',
							placeholder: 'Approve note (required)'
						})
					],
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Accept,
						text: 'Approve',
						enabled: true,
						press: function () {
							var sText = sap.ui.getCore().byId('submitDialogTextarea').getValue();
							that.remarkText = sText;
							sap.m.MessageToast.show('Note is: ' + sText);
							oDialog.close();
                            that.completeTask(true);
						}
					}),
					endButton: new sap.m.Button({
						text: 'Cancel',
						press: function () {
							oDialog.close();
						}
					}),
					afterClose: function () {
						oDialog.destroy();
					}
				});
				oDialog.open();
			
              //this.completeTask(true);
            },
            this
          );

          this.getInboxAPI().addAction(
            {
              action: "REJECT",
              label: "Reject",
              type: "reject", // (Optional property) Define for negative appearance
            },
            function () {
                var that = this;
                var oDialog = new sap.m.Dialog({
                    title: 'Rejection',
                    type: 'Message',
                    content: [
                        new sap.m.Label({
                            text: 'Kindly enter the reason for rejection.',
                            labelFor: 'submitDialogTextarea'
                        }),
                        new sap.m.TextArea('submitDialogTextarea', {
                            liveChange: function (oEvent) {
                                var sText = oEvent.getParameter('value');
                                var parent = oEvent.getSource().getParent();
                                parent.getBeginButton().setEnabled(sText.length > 0);
                            },
                            width: '100%',
                            placeholder: 'Rejection note (required)'
                        })
                    ],
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Reject,
                        text: 'Reject',
                        enabled: false,
                        press: function () {
                            var sText = sap.ui.getCore().byId('submitDialogTextarea').getValue();
                            that.remarkText = sText;
                            sap.m.MessageToast.show('Note is: ' + sText);
                            oDialog.close();
                            that.completeTask(false);
                            
                        }
                    }),
                    endButton: new sap.m.Button({
                        text: 'Cancel',
                        press: function () {
                            oDialog.close();
                        }
                    }),
                    afterClose: function () {
                        oDialog.destroy();
                    }
                });
                oDialog.open();
            
              //this.completeTask(false);
            },
            this
          );
        },

        setTaskModels: function () {
          // set the task model
          var startupParameters = this.getComponentData().startupParameters;
          this.setModel(startupParameters.taskModel, "task");

          // set the task context model
          var taskContextModel = new sap.ui.model.json.JSONModel(
            this._getTaskInstancesBaseURL() + "/context"
          );
          this.setModel(taskContextModel, "context");
        },

        _getTaskInstancesBaseURL: function () {
          return (
            this._getWorkflowRuntimeBaseURL() +
            "/task-instances/" +
            this.getTaskInstanceID()
          );
        },

        _getWorkflowRuntimeBaseURL: function () {
          var appId = this.getManifestEntry("/sap.app/id");
          var appPath = appId.replaceAll(".", "/");
          var appModulePath = jQuery.sap.getModulePath(appPath);

          return appModulePath + "/bpmworkflowruntime/v1";
        },

        getTaskInstanceID: function () {
          return this.getModel("task").getData().InstanceID;
        },

        getInboxAPI: function () {
          var startupParameters = this.getComponentData().startupParameters;
          return startupParameters.inboxAPI;
        },

        completeTask: function (approvalStatus) {
            var that = this;
          this.getModel("context").setProperty("/approved", approvalStatus);
          this.getModel("context").setProperty("/message", that.remarkText);
          this._patchTaskInstance();
          this._refreshTaskList();
        },

        _patchTaskInstance: function () {
          var data = {
            status: "COMPLETED",
            context: this.getModel("context").getData(),
          };

          jQuery.ajax({
            url: this._getTaskInstancesBaseURL(),
            method: "PATCH",
            contentType: "application/json",
            async: false,
            data: JSON.stringify(data),
            headers: {
              "X-CSRF-Token": this._fetchToken(),
            },
          });
        },

        _fetchToken: function () {
          var fetchedToken;

          jQuery.ajax({
            url: this._getWorkflowRuntimeBaseURL() + "/xsrf-token",
            method: "GET",
            async: false,
            headers: {
              "X-CSRF-Token": "Fetch",
            },
            success(result, xhr, data) {
              fetchedToken = data.getResponseHeader("X-CSRF-Token");
            },
          });
          return fetchedToken;
        },

        _refreshTaskList: function () {
          this.getInboxAPI().updateTask("NA", this.getTaskInstanceID());
        },
      }
    );
  }
);
