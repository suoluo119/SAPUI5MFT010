sap.ui.define([
		"sap/ui/mft010/wt/controller/BaseController",
		"sap/ui/core/routing/History",
		"sap/ui/model/odata/v2/ODataModel",
		"sap/ui/core/UIComponent",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/ui/core/routing/Route",
		"sap/ui/model/json/JSONModel",
		"sap/m/MessageBox",
	],
	function (
		BaseController,
		History,
		ODataModel,
		UIComponent,
		Filter,
		FilterOperator,
		Route,
		JSONModel,
		MessageBox) {
		"use strict";
		var sCount;
		var sVBELN = '';
		var sCOSTK = '';
		var sWERKS = '';
		var bUpdate = false;
		//var oModel = new ODataModel("/sap/opu/odata/SAP/ZGTMMF070_SRV", true);
		var oModel = new ODataModel("proxy/http/160.21.205.176:8001/sap/opu/odata/SAP/ZGTMMF070_SRV?sap-client=331", true);
		return BaseController.extend("sap.ui.mft010.wt.controller.MaDetail", {
			/**
			 * APP Opened Initialization at First Time
			 * Then into Router
			 */
			onInit: function () {
				this.getRouter().getRoute("madetail").attachPatternMatched(this.fRouteMatched, this);
			},
			/*Router function: when nav this page, receive the first page DB
			 * The 
			 * */
			fRouteMatched: function (oEvent) {
				var oI18n = this.getView().getModel('i18n').getResourceBundle();
				// Set bUpdate
				bUpdate = false;
				// Get Model
				var _MaRequestHome = this.getOwnerComponent().getModel('MaRequestHome');
				var osData = _MaRequestHome.getData();
				sWERKS = osData.WERKS;
				sCOSTK = osData.COSTK;
				if (sCOSTK == '0') {
					this._showAprBt();
				} else if (sCOSTK == '1') {
					this._showCancelAprBt();
				}
				// Get Router of Args.
				var oArgs = oEvent.getParameter("arguments");
				sVBELN = oArgs.VBELN;
				this.fShowBusyIndicator();
				var that = this;
				var aFilter = [];
				var oVBELN = new Filter({
					path: 'VBELN',
					operator: FilterOperator.EQ,
					value1: sVBELN,
					value2: ''
				});
				var oWERKS = new Filter({
					path: 'WERKS',
					operator: FilterOperator.EQ,
					value1: sWERKS,
					value2: ''
				});
				aFilter.push(oVBELN);
				aFilter.push(oWERKS);
				oModel.read("/DocumentSet/", {
					async: false,
					filters: aFilter,
					success: function (oERP) {
						that.fHideBusyIndicator();
						if (oERP.results[0].MSGTY == "E") {
							/*that.getView().byId("tableHeader").setText(
							                oI18n.getText("routTitle") + "(0)");*/
							that.fShowMessageBox('error', oERP.results[0].MSGCT);
							that.getView().byId("table").setModel(new JSONModel([]));
							that.getView().setModel(new JSONModel());
							return;
						} else if (oERP.results[0].MSGTY == "S") {
							sCount = oERP.results.length;
							//Inner table search field
							for (var i in oERP.results) {
								var posnr = oERP.results[i].POSNR;
								var matnr = oERP.results[i].MATNR;
								var maktx = oERP.results[i].MAKTX;
								var menge = oERP.results[i].MENGE;
								var meins = oERP.results[i].MEINS;
								var kostl = oERP.results[i].KOSTL;
								var grund = oERP.results[i].GRUND;
								var zcomm = oERP.results[i].ZCOMM;
								var lfdat = oERP.results[i].LFDAT;
								var total = oERP.results[i].TOTAL;
								oERP.results[i].filter = posnr + matnr + maktx + menge + meins + kostl + grund + zcomm + lfdat + total;

							}
							var oTable = that.getView().byId('table');
							var oModel = new JSONModel(oERP);
							oTable.setModel(oModel);
						}
					},
					error: function (oError) {
						that.fHideBusyIndicator();
						that.getView().setModel(new JSONModel());
						that.fShowMessageBox('error', oError.message);
					}
				});
				that.getView().byId("tableHeader").setText(
					oI18n.getText("requestNum") + ":" + sVBELN);
			},

			//back to previous page
			onNavBack: function (oEvent) {
				var bUpdateModel = new JSONModel({
					bUpdate: bUpdate
				});
				this.getOwnerComponent().setModel(bUpdateModel, 'bUpdateModelmmf070');
				history.go(-1);
			},
			//Inner table search
			onTableSearch: function (oEvent) {
				var oI18n = this.getView().getModel("i18n").getResourceBundle();
				var aFilters = [];
				var sQuery = this.getView().byId("searchField").getValue();
				this.sQuery = oEvent.getSource().getValue();
				var f3 = new Filter("filter", sap.ui.model.FilterOperator.Contains, sQuery);
				aFilters.push(f3);
				var oTable = this.getView().byId('table');
				var binding = oTable.getBinding("items");
				binding.filter(aFilters, "Application");
				//sCount = oTable.getItems().length;
				//alert(sCount);
				//this.getView().byId("notProveBtId").setCount(sCount);
			},
			//Warning before delete 
			//bottom reject/delete button
			onDelItems: function () {
				var aSelectedItems, oSelected, oSelectedLists, delAprItems, submitUrl;
				var arrSelectedType;
				aSelectedItems = this.getView().byId("table").getItems();
				oSelected = aSelectedItems[0];
				oSelectedLists = oSelected.getBindingContext().getProperty();
				arrSelectedType = oSelectedLists.VBELN;
				submitUrl = '/RejectSet/';
				delAprItems = sWERKS + '@$&' + arrSelectedType + '|';
				this.warningMsgDialog("WARNING", "warningMsg", delAprItems, submitUrl);
			},
			//Approve items
			onApprove: function () {
				var aSelectedItems, oSelected, oSelectedLists, aprSelectedItems, submitUrl;
				var aprSelectedType;
				aSelectedItems = this.getView().byId("table").getItems();
				oSelected = aSelectedItems[0];
				oSelectedLists = oSelected.getBindingContext().getProperty();
				aprSelectedType = oSelectedLists.VBELN;
				submitUrl = '/ApproveSet/';
				aprSelectedItems = sWERKS + '@$&' + aprSelectedType + '|';
				this.warningMsgDialog("WARNING", "warningApr", aprSelectedItems, submitUrl);
			},
			//Cancel approved
			onCancelApro: function () {
				var aSelectedItems, oSelected, oSelectedLists, cancelAprItems, submitUrl;
				var cancelAprSelectedType;
				aSelectedItems = this.getView().byId("table").getItems();
				oSelected = aSelectedItems[0];
				oSelectedLists = oSelected.getBindingContext().getProperty();
				cancelAprSelectedType = oSelectedLists.VBELN;
				submitUrl = '/DeleteSet/';
				cancelAprItems = sWERKS + '@$&' + cancelAprSelectedType + '|';
				this.warningMsgDialog("WARNING", "warningAprCancel", cancelAprItems, submitUrl);
			},
			/**
				 * Warning before operation of reject,approve,cancel approved.
				 * @public
				 * @param sMsgTitle : Title of Dialog
						  sMsg : Warning content
						  itemsMsg : data back to DB
				 */
			warningMsgDialog: function (sMsgTitle, sMsg, itemsMsg, sUrl) {
				var that = this;
				var oI18n = this.getView().getModel('i18n').getResourceBundle();
				var dialog = new sap.m.Dialog({
					title: oI18n.getText(sMsgTitle),
					type: 'Message',
					state: 'Warning',
					content: new sap.m.Text({
						text: oI18n.getText(sMsg),
					}),
					beginButton: new sap.m.Button({
						text: oI18n.getText("ConfirmTitle"),
						type: 'Reject',
						press: function () {
							var oTimeStap = new Date();
							var oData = {
								'LINE': itemsMsg
							};
							oModel.create(sUrl + "?" + oTimeStap, oData, {
								async: false,
								success: function (oData) {
									if (oData.MSGTY == "E") {
										that.fShowMessageBox('error', oData.MSGCT);
									} else if (oData.MSGTY == "S") {
										that.onRefresh();
										//that.fShowMessageBox('success', oI18n.getText("successMsg"));
										var osuccessMsgDialog = new sap.m.Dialog({
											title: oI18n.getText('boxSuccess'),
											type: 'Message',
											state: 'Success',
											content: [new sap.m.Label({
												text: oI18n.getText("successMsg")
											})]
										});
										osuccessMsgDialog.open();
										osuccessMsgDialog.addButton(new sap.m.Button({
											text: oI18n.getText('okBtn'),
											press: function () {
												osuccessMsgDialog.close();
												that.createRefreshModel();
											}
										}));
									}
								},
								error: function (oError) {
									that.fShowMessageBox('error', oError.message);
								}
							});
							dialog.close();
						}
					}),
					endButton: new sap.m.Button({
						text: oI18n.getText("cancelBtn"),
						press: function () {
							dialog.close();
						}
					}),
					afterClose: function () {
						//The delete operation of after confirm
						dialog.destroy();
					}
				});
				dialog.open();
			},

			fHideBusyIndicator: function () {
				var oDialog = sap.ui.getCore().byId('BusyDialog');
				if (oDialog) {
					oDialog.close();
				}
			},
			fShowBusyIndicator: function () {
				var oDialog = sap.ui.getCore().byId('BusyDialog');
				if (!oDialog) {
					oDialog = new sap.m.BusyDialog('BusyDialog');
				}
				oDialog.open();
			},

			//Show button Approve,Reject and hidden Cancel Approved
			_showAprBt: function () {
				var rejectElm = this.getView().byId("rejectBtid");
				var approveElm = this.getView().byId("approveBtid");
				var cancelApproveElm = this.getView().byId("cancelApproveBtid");
				if (cancelApproveElm.getVisible(true)) {
					rejectElm.setVisible(true);
					approveElm.setVisible(true);
					cancelApproveElm.setVisible(false);
				}
			},
			//Show button Cancel Approved and hidden Approve,Reject
			_showCancelAprBt: function () {
				var rejectElm = this.getView().byId("rejectBtid");
				var approveElm = this.getView().byId("approveBtid");
				var cancelApproveElm = this.getView().byId("cancelApproveBtid");
				if (approveElm.getVisible(true) && rejectElm.getVisible(true)) {
					cancelApproveElm.setVisible(true);
					approveElm.setVisible(false);
					rejectElm.setVisible(false);
				}
			},

			// confirm, alert, error, information, warning, success
			fShowMessageBox: function (type, content) {
				var oI18n = this.getView().getModel("i18n").getResourceBundle();
				var bCompact = !!this.getView().$().closest(".sapUiSizeCozy").length;
				var Options = null;
				if (type == 'none') {
					Options = {
						icon: sap.m.MessageBox.Icon.NONE,
						title: oI18n.getText("noneBox"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				} else if (type == 'question') {
					Options = {
						icon: sap.m.MessageBox.Icon.QUESTION,
						title: oI18n.getText("questionBox"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				} else if (type == 'error') {
					Options = {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: oI18n.getText("boxError"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				} else if (type == 'information') {
					Options = {
						icon: sap.m.MessageBox.Icon.INFORMATION,
						title: oI18n.getText("informationBox"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				} else if (type == 'warning') {
					Options = {
						icon: sap.m.MessageBox.Icon.WARNING,
						title: oI18n.getText("WARNING"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				} else if (type == 'success') {
					Options = {
						icon: sap.m.MessageBox.Icon.SUCCESS,
						title: oI18n.getText("boxSuccess"),
						actions: sap.m.MessageBox.Action.OK,
						onClose: null,
						styleClass: bCompact ? "sapUiSizeCozy" : "",
						initialFocus: null,
						textDirection: sap.ui.core.TextDirection.Inherit
					};
				}
				sap.m.MessageBox.show(content, Options);
			},
			onRefresh: function () {
				this.getView().byId("table").setModel(new JSONModel([]));
			},

			createRefreshModel: function () {
				bUpdate = true;
				var bUpdateModel = new JSONModel({
					bUpdate: bUpdate
				});
				this.getOwnerComponent().setModel(bUpdateModel, 'bUpdateModelmmf070');
				history.go(-1);
			},
		});
	});