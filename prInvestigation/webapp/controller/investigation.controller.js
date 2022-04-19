sap.ui.define(
    ["sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment"],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, MessageToast, MessageBox, Filter,
        FilterOperator, Fragment) {
        "use strict";

        return Controller.extend(
            "com.pr.prInvestigation.controller.investigation",
            {
                onInit: function () {
                    this._oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                    // this.getView().setModel(
                    //     new sap.ui.model.json.JSONModel({
                    //         initialContext: JSON.stringify(
                    //             { someProperty: "some value" },
                    //             null,
                    //             4
                    //         ),
                    //         apiResponse: "",
                    //     })
                    // );
                    //this.getProductBatchData();
                },
                onComplaintNumberInput: function (oEvent) {

                    var complaintNo = oEvent.getParameter("value");
        
                    var oCompModel = this.getView().getModel("complaintModel");
                    if (typeof (oCompModel) === "undefined") {
                        oCompModel = new JSONModel();
                    }
                    oCompModel.setData({
                        invStartDate: null,
                        invEndDate: null,
                        recall: false,
                        class: null
                    });
        
                    var aFilter = [];
                    if (complaintNo !== "") {
                        aFilter.push(new Filter("complaintNo", FilterOperator.EQ, complaintNo));
        
                        this.getComplaintData(aFilter, oCompModel);
                    }
                },
        
                getComplaintData: function (aFilters, complaModel) {
        
                    var oModel = this.getOwnerComponent().getModel("pModel");
                    complaModel.setData([]);
        
                    var oHeaderPromise = new Promise(function (resolve, reject) {
        
                        oModel.read("/Complaints", {
                            filters: aFilters,
                            urlParameters: {
                                "$expand": "typeOfComplaint"
                            },
                            success: function (oData, response) {
                                if (oData.results.length > 0) {
                                    oData.results[0].invStartDate = null;
                                    oData.results[0].invEndDate = null;
                                    oData.results[0].recall = false;
                                    oData.results[0].class = null;
                                    complaModel.setData(oData.results[0]);
                                    complaModel.updateBindings(true);
                                } else {
                                    MessageToast.show("Complaint Number is not available")
                                }
                                this.getView().setModel(complaModel, "complaintModel");
        
                                resolve(oData);
                            }.bind(this),
                            error: function (oError) {
                                this.handleErrorResponse(oError);
                                reject(oError);
                            }.bind(this)
                        });
                    }.bind(this));
                },
        
                createObjectForInvestigation: function (data) {
        
                    var invObject = {
                        investigationNumber: "%0000001",
                        product: data.product,
                        complaintNumber_ID: data.ID,
                        recallRequired: data.recall,
                        recallNumber: "",
                        startDate: data.invStartDate,
                        endDate: data.invEndDate,
                        investigator: data.investigationBy,
                        remarks: data.invRemarks,
                        class: data.class
                    };
        
                    return invObject;
        
                },
        
                validateInputFields: function () {
        
                    var aInpFieldsToValidate = [];
                    var oView = this.getView();
                    var bError = false;
                    aInpFieldsToValidate.push("investigationStartDate", "investigationEndDate");
        
                    var validateMandatoryInputFields = x => {
                        var columnToBeValidated = oView.byId(x);
        
                        if (columnToBeValidated.getValueState() === sap.ui.core.ValueState.Error) {
                            bError = true;
                        }
                    };
                    aInpFieldsToValidate.forEach(validateMandatoryInputFields);
                    return bError;
                },
        
                onCreateInvestigation: function (nodesModel) {
        
                    var nodesModel = this.getView().getModel("complaintModel");
                    if (!nodesModel || !nodesModel.getData().ID) {
                        MessageToast.show("Please check Complaint Number");
                        return;
                    }
                    var data = nodesModel.getData();
                    if (this.validateInputFields()) {
                        MessageToast.show("Enter value for mandatory fields to continue");
                        return;
                    }
        
                    //Validation if the Complaint staus is not new.
                    if (data.status_code !== "new") {
                        MessageToast.show("Complaint already processed. Can't be assigned.");
                        return;
                    }
        
                    var oEntryData = this.createObjectForInvestigation(data);
                    console.log(oEntryData);
                    this.adata = this.createObjectForInvestigation(data); 
                    //this.createInvestigation(oEntryData);
                    if(oEntryData.recallRequired === true){
                    // this.getProductBatchData();
                    this.getBusinessRuleoData();
                   }
                    else{
                        this.getBusinessRuleoData();//if recall required is not true, inorder to create investigation number
                    }

                    //         if(this.approvalData !== undefined){
                    // if (this.approvalData.length > 0) {
                    // 	//this._loadWorkFlowProcess(_oContext);
                    // 	this.onWFConform();
                    // } else {
                    // 	sap.m.MessageBox.error("No Busineess Rule defined for the Company Code and Project/ Department.");
        
                    // }
                    //         }
                },
        
                createInvestigation: function (oEntryData, index = "1") {
        
                    var oDataModel = this.getOwnerComponent().getModel("pModel");
                    return new Promise(function (resolve, reject) {
        
                        oDataModel.create("/Investigations", oEntryData, {
                            changeSetId: index.toString(),
                            success: function (oData, response) {
                                var sMessage = "Investigation created successfully : " + oData.investigationNumber;
                                this.investigation_No = oData.investigationNumber;
                                this.recall_req = oData.recallRequired;         
                                if (oData.recallNumber.length > 0) {
                                    sMessage = sMessage.concat("\n", "Recall Number generated successfully : ", oData.recallNumber);
                                }
                                MessageBox.success(sMessage, {
                                    actions: [MessageBox.Action.OK],
                                    onClose: function () {
                                        var oCompModel = this.getView().getModel("complaintModel");
                                        oCompModel.setData({
                                            invStartDate: null,
                                            invEndDate: null,
                                            recall: false,
                                            class: null
                                        });
                                        var that = this;
                                        // var token = that._fetchToken();
                                        //var oData = oEntryData;
                                        // var fnSuccess = function () {
                                        // 		MessageBox.show("workflow started successfully");
                                        // 	},
                                        // 	fnError = function () {
                                        // 		MessageBox.show("workflow failed");
                                        // 	};
                                        // that._startInstance(token, oData, fnSuccess, fnError);
                                    }.bind(this)
                                });
                                resolve({
                                    data: oData,
                                    response
                                });
                                this.onWFConform();
                            }.bind(this),
                            error: function (oResult) {
                                this.handleErrorResponse(oResult);
                                reject(oResult);
                            }.bind(this)
                        });
                    }.bind(this));
        
                },
        
                onShowDetailsPress: function (oEvent) {
                    var nodesModel = this.getView().getModel("complaintModel");
                    var data = nodesModel.getData();
                    var aFilter = [];
                    this.handleDisplayProductPress(oEvent);

        
                    if (data) {
                        aFilter.push(new Filter("MaterialNumber", FilterOperator.EQ, data.product));
                        aFilter.push(new Filter("Batch", FilterOperator.EQ, data.batch));
                        //this.getProductBatchData(aFilter, oEvent);
                        this.getProductBatchData();
                    }
        
                },
        
                handleDisplayProductPress: function (oEvent) {
        
                    var oBtn = oEvent.getSource();
        
                    if (!this._oMessagesDialog) {
                        Fragment.load({
                            name: "com.pr.prInvestigation.view.fragments.ProductDetails",
                            controller: this,
                            id: this.getView().getId()
                        }).then(function (oPopover) {
                            this._oMessagesDialog = oPopover;
                            this.getView().addDependent(this._oMessagesDialog);
                            this._oMessagesDialog.openBy(oBtn);
                        }.bind(this));
                    } else {
                        this._oMessagesDialog.openBy(oBtn);
                    }
                },
        
                //Method to get close message dialog
                handleCloseMessageDialog: function () {
                    this._oMessagesDialog.close();
                },
        
                getProductBatchData: function () {
        
                    // var nodesModel = this.getView().getModel("productBatchDetails");
                    // if (typeof (nodesModel) === "undefined") {
                    //     nodesModel = new JSONModel();
                    // }
                    // nodesModel.setData([]);
                    // var arr = [];
                    

                    // var nodesModel = new JSONModel();
                    // this.getView().setModel(nodesModel, "productBatchDetails");
        
                    // var oModel = this.getOwnerComponent().getModel("prodRecall");
        
                    // var oHeaderPromise = new Promise(function (resolve, reject) {
        
                    //     oModel.read("/ProdRecallSet(MaterialNumber='TD000001',Batch='555')/Details", {
                    //         //filters: aFilters,
                    //         // urlParameters: {
                    //         //     "$expand": "NAVMAT,NAVSOLD"
                    //         // },
                    //         success: function (oData, response) {
                    //             console.log(oData);
                    //             if (oData.results.length > 0) {
                    //                 // nodesModel.setData(oData.results[0].NAVMAT.results);
                    //                 // nodesModel.setData(oData.results[0]);
                    //                 // arr.push(oData.results[0]);
                    //                 // nodesModel.updateBindings(true);
                    //                 this.getView().getModel("productBatchDetails").setData(oData.results[0]);
                    //             }
                    //             //   this._oMessagesDialog.openBy(oEvent.getSource());
        
                    //             resolve(oData);
                    //             //this.getView().setModel(arr,"productBatchDetails");
                    //         }.bind(this),
                    //         error: function (oError) {
                    //             this.handleErrorResponse(oError);
                    //             reject(oError);
                    //         }.bind(this)
                    //     });
                    // }.bind(this));
                    var that = this;
                    var sModel= this.getView().getModel("complaintModel");
                    var mProduct = sModel.getData().product;
                    console.log(mProduct);
                    var oModel = this.getOwnerComponent().getModel("prodRecall");
                    var pModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(pModel,"prodBatchDetails");
                    

                    oModel.read("/ProdRecallSet(MaterialNumber='" + mProduct + "')/Details",{
                        success: function(oData) {
                            console.log(oData);
                             that.pData = [];
                            if(oData.results.length > 0){
                                for (var i=0; i< oData.results.length; i++){
                                    var bData= {
                                    "MaterialNumber" : oData.results[i].MaterialNumber,
                                    "MaterialDescription": oData.results[i].MaterialDescription,
                                    "Batch" : oData.results[i].Batch,
                                    "Plant" : oData.results[i].Plant,
                                    "StockInHand": oData.results[i].StockInHand,
                                    "SoldQuantity": oData.results[i].SoldQuantity,
                                    "SoldUnit": oData.results[i].SoldUnit,
                                    "SalesOrder": oData.results[i].SalesOrder,
                                    "SalesValue": oData.results[i].SalesValue,
                                    "BatchExpDate": oData.results[i].BatchExpDate,
                                    "Currency":oData.results[i].Currency
                                    }
                                    that.pData.push(bData);
                                }
                            }
                            that.getView().getModel("prodBatchDetails").setData(oData.results);
                        },
                        error : function(){
                            MessageBox.show("Error");
                        }
                    });

                },
        
                // Handle error response if any from HTTP call
                handleErrorResponse: function (oResponse) {
                    var sErrMsg = "";
                    // Read response and display error message
                    if (oResponse.responseText) {
        
                        if (jQuery.sap.startsWith(oResponse.responseText, "{\"error\":")) {
                            sErrMsg = JSON.parse(oResponse.responseText).error.message.value;
                        } else {
                            // Retrieve Error Message From XML returned
                            sErrMsg = this.getMessageFromXMLResponse(oResponse.responseText);
                        }
                    }
                    if (sErrMsg.length === 0) {
                        sErrMsg = this._oResourceBundle.getText("xmsg.ErrorOccurred");
                    }
                    /* Addition of duration to messagetoast to display the error message for longer duration */
                    MessageToast.show(sErrMsg, {
                        duration: 10000,
                        width: "40em",
                        autoClose: false
                    });
                },
        
                getMessageFromXMLResponse: function (sResponseText) {
                    var sErrMsg = this._oResourceBundle.getText("xmsg.ErrorOccurred");
                    if (sResponseText) {
                        var parser = new DOMParser();
                        var xmlDoc = parser.parseFromString(sResponseText, "text/xml");
                        if (xmlDoc) {
                            var msgElement = xmlDoc.getElementsByTagName("message");
                            if (msgElement && msgElement.length > 0) {
                                return msgElement[0].childNodes[0].nodeValue;
                            } else {
                                var error = xmlDoc.getElementsByTagName("h1");
                                if (error && error.length > 0) {
                                    return error[0].childNodes[0].wholeText;
                                }
                            }
                        }
                    }
                    return sErrMsg;
                },
                getBusinessRuleoData: function () {
                    this.getProductBatchData();
                    var _oContext = this;
                    var oModel1 = this.getOwnerComponent().getModel("pModel");
                    var aModel = this.getView().getModel("complaintModel");
                    var data1 = aModel.getData();
                    //var aFilter = [];
                    this.materialNo = data1.product;
                    this.batchNo = data1.batch;
                    // if (data1) {
                    //     aFilter.push(new Filter("materialNumber", FilterOperator.EQ, data1.product));
                    //     aFilter.push(new Filter("batchNumber", FilterOperator.EQ, data1.batch));
                    // }
                    //(companyCode = " + "*" + ")
                    oModel1.read("/approverTable", {
                        //filters: aFilter,
                        success: function (oData, oResponse) {
                            //this._inObj.approvalData = [];
                               _oContext.aObj = [];
                            if (oData.results.length > 0) {
                                for (var i = 0; i < oData.results.length; i++) {
                                    var obj = {
                                        "ApproverEmail": oData.results[i].emailId,
                                        "ApproverName": oData.results[i].fullName,
                                        "Level": oData.results[i].level,
                                        "Rule": oData.results[i].actorType
                                    }
                                    _oContext.aObj.push(obj);
                                //	console.log(aObj);
                                }
                            //	MessageBox.show("success");
                            _oContext.createInvestigation(_oContext.adata);
                               // _oContext.onWFConform();
                            } else {
                                sap.m.MessageBox.error("No Busineess Rule defined for the Company Code and Project/ Department.");
        
                            }
        
                        },
                        error: function () {
                            MessageBox.error("error in getting approver data");
                        }
                    });
                },
        
                onWFConform: function () {
                    var that = this;
                    var array = [];
                    this.initiatorData();
                    // var yModel = this.getView().getModel("prodBatchDetails");
                    // var sdata =  yModel.getData();
                    var oModelData = this.getOwnerComponent().getModel("pModel");
                    var inputValue = {
                            comments: array,
                            investigationNumber: that.investigation_No,
                            // materialNumber: that.materialNo,
                            // batchNumber: that.batchNo,
                            // Plant: sdata.Plant,
                            // Quantity: sdata.SoldQuantity,
                            // description: oModelData.projectDescription,
                            // version: oModelData.version,
                            //	planId: sPlanId,
                            initiatorEmail: that.initiatorMail,
                            initiatorName: that.initiatorName,
                            //	approversList: this.__gObject._approversList,
                            approversList: that.aObj,
                            productList: that.pData,
                            //added by purva to get dynamic url for notification mail
                            //	configTableURL: _oContext.__gObject.configTableURLValue,
                            isApproved: null,
                            currentApproverName: null,
                            isFinalApprover: null,
                            hasNextApprover: null,
                            currentApprover: null,
                            isInternal: null,
                            isExternal: null
                        },
                        oData = {
                            definitionId: "prodrecallwf",
                            context: inputValue
                        };
                    var token = that._fetchToken();
                    
                    var fnSuccess = function () {
                            MessageBox.success("workflow started successfully");
                        },
                        fnError = function () {
                            MessageBox.error("workflow failed");
                        };
                    that._startInstance(token, oData, fnSuccess, fnError);
        
                },
        
                initiatorData: function () {
                    var _oContext = this;
                    var oModel = this.getOwnerComponent().getModel("pModel");
                    oModel.read("/getLoggedData", {
                        success: function (oData, oResponse) {
                            var initiatorData = JSON.parse(oData.results);
                            _oContext.initiatorMail = initiatorData.ID;
                            //	if(initiatorData.name!== undefined)
                            _oContext.initiatorName = initiatorData.name.givenName + " " + initiatorData.name.familyName;
                            // this.initiatorMail = initiatorData.ID;
                            // this.initiatorName = initiatorData.name.givenName + " " + initiatorData.name.familyName;
                            // if(initiatorData.name!== undefined)
                            // _oContext.__gObject.initiatorName = initiatorData.name.givenName + " " + initiatorData.name.familyName;
                        }
                    });
                },

                // startWorkflowInstance: function () {
                //     var model = this.getView().getModel();
                //     var definitionId = "prodrecallwf";
                //     var initialContext = model.getProperty("/initialContext");

                //     var data = {
                //         definitionId: definitionId,
                //         context: JSON.parse(initialContext),
                //     };

                //     $.ajax({
                //         url: this._getWorkflowRuntimeBaseURL() + "/workflow-instances",
                //         method: "POST",
                //         async: false,
                //         contentType: "application/json",
                //         headers: {
                //             "X-CSRF-Token": this._fetchToken(),
                //         },
                //         data: JSON.stringify(data),
                //         success: function (result, xhr, data) {
                //             model.setProperty(
                //                 "/apiResponse",
                //                 JSON.stringify(result, null, 4)
                //             );
                //         },
                //         error: function (request, status, error) {
                //             var response = JSON.parse(request.responseText);
                //             model.setProperty(
                //                 "/apiResponse",
                //                 JSON.stringify(response, null, 4)
                //             );
                //         },
                //     });
                // },

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
                _startInstance: function (token, oData, fnSuccess, fnError) {
                    debugger;
                    var that = this;
                    $.ajax({
                        url: this._getWorkflowRuntimeBaseURL()+"/workflow-instances",
                        method: "POST",
                        async: false,
                        contentType: "application/json",
                        headers: {
                            "X-CSRF-Token": token
                        },
                        data: JSON.stringify(oData),
                        success: fnSuccess,
                        error: fnError
                    });
                },

                _getWorkflowRuntimeBaseURL: function () {
                    var appId = this.getOwnerComponent().getManifestEntry("/sap.app/id");
                    var appPath = appId.replaceAll(".", "/");
                    var appModulePath = jQuery.sap.getModulePath(appPath);

                    return appModulePath + "/bpmworkflowruntime/v1";
                },
            }
        );
    }
);
