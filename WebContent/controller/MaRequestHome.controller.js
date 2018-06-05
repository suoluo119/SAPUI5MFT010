sap.ui.define([
	"sap/ui/mmf070/wt/controller/BaseController",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/TablePersoController",
    "sap/ui/mmf070/wt/PersoService",
    "sap/ui/layout/VerticalLayout",
    "sap/ui/layout/form/SimpleForm",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/Dialog",
    "sap/ui/core/routing/History",
    "./Formatter"], 
	function(BaseController,UIComponent,JSONModel,Filter,FilterOperator,MessageToast,
		MessageBox,
		TablePersoController,
		PersoService,
		VerticalLayout,
		SimpleForm,
		ODataModel,
		ResourceModel,
		Dialog,
		History,
		Formatter) {
    'use strict';
	var EMPTY = '';
	var NULL = null;
	var ERROR = 'Error';
	var NONE = 'None';    
    var costCenterHelpData = '';
    var maNumberHelpData = '';
    var requestervalHelpData = '';
    var sPlant;
    var sCount;
    var defaultData = {};
    var newDefaultData = {};
    var searchData = {};
    var SAPBATCH = {};
    var settingModel;
    //var oModel = new ODataModel("/sap/opu/odata/SAP/ZGTMMF070_SRV", true);
    var oModel = new ODataModel("proxy/http/160.21.205.176:8001/sap/opu/odata/SAP/ZGTMMF070_SRV?sap-client=331", true);
    return BaseController.extend('sap.ui.mmf070.wt.controller.MaRequestHome', {
    	inputId: '',
    	onInit: function () {
    		this.fSetDate();
    		this._setBtonEnableF();
    		//select dialog table rows show or hidden
			this._oTPC = new TablePersoController({
                table : this.getView().byId("table"),
                // specify the first part of persistence
                // ids e.g.
                // 'demoApp-productsTable-dimensionsCol'
                componentName : "colsetting",
                persoService : PersoService,
			}).activate();
			var that = this;
			oModel.read("/UserParameters/", {
                async : false,
                success : function(oData) {
                    var sPlant = oData.results[0].WERKS;
                    var sCostCen = oData.results[0].KOSTL;
                    if($.trim(sPlant) == "" || sPlant == null || sPlant == undefined){
                    	that._setEnableClrSrchF();
                    	that.fShowMessageBox('error', that.getModel("i18n").getResourceBundle().getText("defaultEmpty"));
                    }else{
                    	defaultData = oData.results[0];
                    	//that.getView().byId("Plantid").setValue(sPlant);
                    	that.getView().byId("costCenter").setValue(sCostCen);
                    	newDefaultData.WERKS = oData.results[0].WERKS;
                    	newDefaultData.KOSTL = oData.results[0].KOSTL;
                    	var aFilter = [];
                    	var filter = new sap.ui.model.Filter({
                    		path : "WERKS",
                    		operator : sap.ui.model.FilterOperator.EQ,
                    		value1 : sPlant,
                    		value2 : ""
                    	});
                    	aFilter.push(filter);                    
                    	oModel.read("/MaterialSet/", {
                    		async : false,
                    		filters : aFilter,
                    		success : function(oData) {
                    			// search field
                                for ( var i in oData.results) {
                                	var sMATNR = oData.results[i].MATNR;
                                    var sMAKTX = oData.results[i].MAKTX;
                                    //alert(sMATNR + sMAKTX);
                                    oData.results[i].filter = sMATNR + sMAKTX;
                                }
                    			maNumberHelpData = oData;
                    		},
                    		error : function(oError) {
                    			that.fShowMessageBox('error', oError.message);
                    		}
                    	});
                    	oModel.read("/CostCenterSet/", {
                    		async : false,
                    		filters : aFilter,
                    		success : function(oData) {
                    			// search field
                                for ( var i in oData.results) {
                                	var sKOSTL = oData.results[i].KOSTL;
                                    var sKTEXT = oData.results[i].KTEXT;
                                    oData.results[i].filter = sKOSTL + sKTEXT;
                                }
                    			costCenterHelpData = oData;
                    		},
                    		error : function(oError) {
                    			that.fShowMessageBox('error', oError.message);
                    		}
                    	});
                    	//parameter 'nomsg' means method onBottomSearch() don't show 'No Data' Dialog when result is empty
                    	that.onBottomSearch('nomsg');
                    }
                },
                error : function(oError) {
                    that.fShowMessageBox('error', oError.message);
                }
			});
			//refresh the page when nav back
    		var oRouter = UIComponent.getRouterFor(this);
    		oRouter.getRoute('marequesthome').attachMatched(this._onRouteMatched, this);
		},
		_onRouteMatched: function(){
			var bUpdateModel = this.getOwnerComponent().getModel('bUpdateModelmmf070');
	        if(bUpdateModel != NULL && bUpdateModel != EMPTY){
	            var oData = bUpdateModel.getData();
	            var bUpdate = oData.bUpdate;
	            if(bUpdate){
	            	//parameter 'nomsg' means method onBottomSearch() don't show 'No Data' Dialog when result is empty
	                this.onBottomSearch('nomsg');
	            }
	        }
		},
		
		onAfterRendering: function(){
		    !function(){
		    }();
		},
    	
		//Control function of Default value of DatePicker display  
		fSetDate: function(){
            var dDate = new Date();
            if(dDate.getHours() < 8){
                dDate.setDate(dDate.getDate() - 1);
                this.getView().byId('dateRequest').setDateValue(dDate);
            }else{
                this.getView().byId('dateRequest').setDateValue(dDate);
            }
        },
		
		//back to previous page
        onNavBack : function(oEvent) {
            var oHistory, sPreviousHash;
            oHistory = History.getInstance();
            sPreviousHash = oHistory.getPreviousHash();
            window.history.go(-1);
        },
        
        //Cost center helpValue dialog
        costCenterHelpVal : function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._costHelpDialog) {
				this._costHelpDialog = sap.ui.xmlfragment(
					"sap.ui.mmf070.wt.view.costDialog",
					this
				);
				this.getView().addDependent(this._costHelpDialog);
			}
			this._costHelpDialog.setModel(new JSONModel(costCenterHelpData));
			// create a filter for the binding
			this._costHelpDialog.getBinding("items").filter([new Filter(
				"KOSTL",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			// open value help dialog filtered by the input value
			this._costHelpDialog.open(sInputValue);
		},
		_costValueHelpSearch : function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"filter",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_costValueHelpClose : function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.getView().byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
				$("#V1").html(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Material No. helpValue dialog
		maNumberHelpVal : function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();
			this.inputId = oEvent.getSource().getId();
			// create value help dialog
			if (!this._maNumberHelpDialog) {
				this._maNumberHelpDialog = sap.ui.xmlfragment(
					"sap.ui.mmf070.wt.view.maIdDialog",
					this
				);
				this.getView().addDependent(this._maNumberHelpDialog);
			}
			this._maNumberHelpDialog.setModel(new JSONModel(maNumberHelpData));
			// create a filter for the binding
			this._maNumberHelpDialog.getBinding("items").filter([new Filter(
				"MATNR",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);
			// open value help dialog filtered by the input value
			this._maNumberHelpDialog.open(sInputValue);
		},        
		_maIdValueHelpSearch : function (evt) {
			var sValue = evt.getParameter("value");
			var oFilter = new Filter(
				"filter",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			evt.getSource().getBinding("items").filter([oFilter]);
		},
		_maIdValueHelpClose : function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				var productInput = this.getView().byId(this.inputId);
				productInput.setValue(oSelectedItem.getTitle());
				$("#V1").html(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		//Clear the date of the datePicker and other
		fClearMessage : function() {
            this.getView().byId('dateRequest').setValueState("None");
            this.getView().byId('costCenter').setValueState("None");
            this.getView().byId('maIdNumber').setValueState("None");
        },
		//Rest the filter part data
		onClear : function(){
			var that = this;
			var oI18n = this.getView().getModel('i18n').getResourceBundle();
			this.fClearMessage();
			var HH = sap.ui.core.format.DateFormat.getDateInstance({
                pattern : "HH"
            });
            var nowDate = new Date();
            var oDate = HH.format(nowDate);
            if (oDate <= 8) {
                nowDate.setDate(nowDate.getDate() - 1);
            }
            this.getView().byId("dateRequest").setDateValue(nowDate);
            this.getView().byId("costCenter").setValue("");
            this.getView().byId("maIdNumber").setValue("");
            this.getView().byId("requestUser").setValue("");
            this.getView().byId("searchField").setValue("");
            that._setBtonEnableF();
            this.getView().byId("table").setModel(new JSONModel([]));
		},
		//Set the default value of Filter part
		onSetting: function(){
        	var oI18n = this.getView().getModel('i18n').getResourceBundle();
        	var that = this;
        	if(!that._settingDialog){
        		/*settingModel = {
        			WERKS : newDefaultData.WERKS,
        			KOSTL : newDefaultData.KOSTL
                }
            	sap.ui.getCore().setModel(new JSONModel(settingModel),"settingData")*/
        		that._settingDialog = new sap.m.Dialog({
                    title: oI18n.getText("setDialogTitle"),
                    icon: "sap-icon://employee",
                    state: 'Success',
                    content: [
                      new sap.ui.layout.form.SimpleForm({
                    	content: [
							new VerticalLayout({
								width: '350px',
								content: [
							      new sap.m.Label({text : oI18n.getText("plant"),required:true}),
								  new sap.m.Input("dialogPlantId", {valueLiveUpdate:true,maxLength : 4}),
								  new sap.m.Label({text : oI18n.getText("costCenter"),required:false}),
								  new sap.m.Input("dialogCostCenId", {valueLiveUpdate:true,maxLength : 8}),
							  ]})
            	          ]
                      })
                    ]
              	});        		
        		that._settingDialog.setEndButton(new sap.m.Button({
                    text: oI18n.getText("save"),
                    type: "Accept",
                    icon: "sap-icon://save",
                    press: function() {
                    	if(!that.emptyCheckSet()){
                    		return;
                    	}else{
                    		/*settingModel.WERKS = sap.ui.getCore().byId('dialogPlantId').getValue();
                    		settingModel.KOSTL = sap.ui.getCore().byId('dialogCostCenId').getValue();
                    		sap.ui.getCore().setModel(new JSONModel(settingModel),"settingData");*/
                    		//var oData = {};
                    		var oTimeStap = new Date();
                    		newDefaultData.WERKS = sap.ui.getCore().byId('dialogPlantId').getValue();
                    		newDefaultData.KOSTL = sap.ui.getCore().byId('dialogCostCenId').getValue();
                    		oModel.create("/UserParameters/" + "?" + oTimeStap, newDefaultData,{
        	              		success: function(oData){
        	              			if(oData.MSGTY == "E"){
        	              				that.fShowMessageBox('error', oData.MSGCT);
        	  						}else if(oData.MSGTY == "S"){
        	  							that._setEnableClrSrchT();
        	  							that.onInit();
        	  							/*var bUpdate = false;
        	  							var bUpdateModel = new JSONModel({
        	  				                bUpdate: bUpdate
        	  				            });
        	  							that.getOwnerComponent().setModel(bUpdateModel, 'bUpdateModelmmf070');
        	  							that._onRouteMatched();*/
        	  						}
        	                    },
        	                    error: function(oError){
        	      	              	that.fShowMessageBox('error', oError.message);
        	                    }
        	                });
                    		that.getView().byId('iconTabBar').setSelectedKey("0");
                    		that.getView().byId("notProveBtId").setCount("0");
                    		that.getView().byId("provedBtId").setCount("0");
                    		that.getView().byId('notProveBtId').setEnabled(false);
                    		that.getView().byId('provedBtId').setEnabled(false);
                    		that.getView().byId('approveBtid').setEnabled(false);
                    		that.getView().byId('rejectBtid').setEnabled(false);
                    		that.getView().byId('cancelApproveBtid').setEnabled(false);
                    		that.getView().byId("table").setModel(new JSONModel([]));
                    		that._showAprBt();
                    		that._settingDialog.close();
                    	}
                     }
                }));
        		that._settingDialog.setBeginButton(new sap.m.Button({
                    text: oI18n.getText("cancelBtn"),
                    press: function() {
                    	that._settingDialog.close();
                    }
                }));
        	}
        	sap.ui.getCore().byId('dialogPlantId').setValue(defaultData.WERKS);
        	sap.ui.getCore().byId('dialogCostCenId').setValue(defaultData.KOSTL);
        	that._settingDialog.open();
        },
        //Control button of Different status show relate data list(IconTabBar-handleIconTabBarSelect)
        handleIconTabBarSelect : function (oEvent) {
            var oTable = this.getView().byId('table');
            var oAprbinding = oTable.getBinding("items");
			var	sKey = oEvent.getParameter("key");
			this.getView().byId("searchField").setValue("");
			if (sKey == "0") {
				this._showAprBt();
				var aFilters = [];
				var filter = new Filter("COSTK", sap.ui.model.FilterOperator.EQ, "0");
				aFilters.push(filter);
				// update list binding
				oAprbinding.filter(aFilters, "Application");
			} else if(sKey == "1"){
				this._showCancelAprBt();
				var bFilters = [];
				var filter = new Filter("COSTK", sap.ui.model.FilterOperator.EQ, "1");
				bFilters.push(filter);
				// update list binding
				oAprbinding.filter(bFilters, "Application");
			}
		},
		//function for search in table items
        onTableSearch: function(oEvent) {
			var iconTabBarElm = this.getView().byId("iconTabBar");
			var keySatus = iconTabBarElm.getSelectedKey();
			//lenStatus could be 7 or 8,and 8 be selected
			//var lenStatus = iconTabBarElm.mAggregations._header._oItemNavigation.aItemDomRefs[0].attributes.length;
			var oTableSearchState = [];
			var sQuery = oEvent.getParameter("query");
			if(keySatus == 0){
				oTableSearchState = [new Filter("filter0", FilterOperator.Contains, sQuery)];
			}else if(keySatus == 1){
				oTableSearchState = [new Filter("filter1", FilterOperator.Contains, sQuery)];
			}
			this._applySearch(oTableSearchState);
		},
		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applySearch: function(oTableSearchState) {
			var that = this;
			var oTable = this.getView().byId('table');
            var binding = oTable.getBinding("items");
            binding.filter(oTableSearchState, "Application");
		},
        //Empty checking of Dialog that set default value
        emptyCheckSet : function() {
            var oplantelm = sap.ui.getCore().byId('dialogPlantId');
            //var ocostelm = sap.ui.getCore().byId("dialogCostCenId");
            oplantelm.setValueState("None");
            var splantval = oplantelm.getValue();
            //var scostval = ocostelm.getValue();
            if (splantval == null || $.trim(splantval) == '') {
            	oplantelm.setValueState("Error");
            	oplantelm.focus();
                return false;
            } 
            /*else if (scostval == null || $.trim(scostval) == '') {
            	ocostelm.setValueState("Error");
            	ocostelm.focus();
                return false;
            }*/
            return true;
        },
        //Show button Approve,Reject and hidden Cancel Approved
        _showAprBt: function(){
        	var approveElm = this.getView().byId("approveBtid");
        	var rejectElm = this.getView().byId("rejectBtid");
			var cancelApproveElm = this.getView().byId("cancelApproveBtid");
        	if(cancelApproveElm.getVisible(true)){
				rejectElm.setVisible(true);
				approveElm.setVisible(true);
				cancelApproveElm.setVisible(false);
			}
        },
        //Show button Cancel Approved and hidden Approve,Reject
        _showCancelAprBt: function(){
        	var rejectElm = this.getView().byId("rejectBtid");
			var approveElm = this.getView().byId("approveBtid");
			var cancelApproveElm = this.getView().byId("cancelApproveBtid");
        	if(approveElm.getVisible(true)&&rejectElm.getVisible(true)){
				cancelApproveElm.setVisible(true);
				approveElm.setVisible(false);
				rejectElm.setVisible(false);
			}
        },
		//Set IconTabFilter enabled and display zero
		_onSetIcTabFltState : function(){//notProveBtId
			this.getView().byId('iconTabBar').setSelectedKey("0");
			this.getView().byId("notProveBtId").setCount("0");
            this.getView().byId("provedBtId").setCount("0");
            this.getView().byId('notProveBtId').setEnabled(false);
			this.getView().byId('provedBtId').setEnabled(false);
			var notAprBtElm = this.getView().byId("notProveBtId");
			var AprdBtElm = this.getView().byId("provedBtId");
			if(notAprBtElm.getKey() == "0"){
				var that = this;
				that._showAprBt();
			}
		},
		//set NotApprove,Approved,Count,Table Search,
		//Button of Approve,Reject,Cancel Approved enable.
		_setBtonEnableF : function(){
			this._onSetIcTabFltState();
			//set bottom button cancel Approved hidden
			this._showAprBt();
			this.getView().byId("searchField").setValue("");
			this.getView().byId('searchField').setEnabled(false);
			//set bottom button can't operate
			this.getView().byId('approveBtid').setEnabled(false);
			this.getView().byId('rejectBtid').setEnabled(false);
			this.getView().byId('cancelApproveBtid').setEnabled(false);
			
		},
		//Set enabled be false of buttons clear and search when default value is empty
		_setEnableClrSrchF : function(){
			this.getView().byId('dateRequest').setEnabled(false);
			this.getView().byId('costCenter').setEnabled(false);
			this.getView().byId('maIdNumber').setEnabled(false);
			this.getView().byId('requestUser').setEnabled(false);
			this.getView().byId('clearBtn').setEnabled(false);
			this.getView().byId('searchBtn').setEnabled(false);
		},
		//Set enabled be true of buttons clear and search when default value is empty
		_setEnableClrSrchT : function(){
			this.getView().byId('dateRequest').setEnabled(true);
			this.getView().byId('costCenter').setEnabled(true);
			this.getView().byId('maIdNumber').setEnabled(true);
			this.getView().byId('requestUser').setEnabled(true);
			this.getView().byId('clearBtn').setEnabled(true);
			this.getView().byId('searchBtn').setEnabled(true);
		},
		//Set enable be true of buttons when result is not empty
		_setEnableBtnT : function(){
			this.getView().byId("searchField").setValue("");
			this.getView().byId('searchField').setEnabled(true);
			this.getView().byId('notProveBtId').setEnabled(true);
			this.getView().byId('provedBtId').setEnabled(true);
			this.getView().byId('approveBtid').setEnabled(true);
			this.getView().byId('rejectBtid').setEnabled(true);
			this.getView().byId('cancelApproveBtid').setEnabled(true);
		},
		onSearch: function(){
			//parameter 'ismsg' means method onBottomSearch() will show 'No Data' Dialog when result is empty
			this.onBottomSearch('ismsg');
		},
        /**Filter Search control, Search button right bottom
         **parameter 'msgStatus': ismsg or nomsg
         **ismsg: There will show a 'No Data' Dialog when result of search is empty
         **nomsg: There will not show a 'No Data' Dialog when result of search is empty 
         **/
		onBottomSearch : function(msgStatus) {
            this.fClearMessage();
            // oI18n.getText("Picking.Date");
            var oI18n = this.getView().getModel("i18n").getResourceBundle();
            this.getView().byId("searchField").setValue("");
            this._onSetIcTabFltState();
            var notAprBtElm = this.getView().byId("notProveBtId");
            var notAprKey = notAprBtElm.getKey();
            var AprdKey = this.getView().byId("provedBtId").getKey();
            // emptyCheck
            var dateVal = this.getView().byId("dateRequest").getValue();
            //var plant =  newDefaultData.WERKS;
            var plant = defaultData.WERKS;
            var costCen = this.getView().byId("costCenter").getValue();
            var maIdNumber = this.getView().byId("maIdNumber").getValue();
            var requesterVal = this.getView().byId("requestUser").getValue();
            //var center = this.getView().byId("centerid").getValue();
            // dateRequest
            if (dateVal == null || $.trim(dateVal) == "") {
                this.getView().byId('dateRequest').setValueState("Error");
                this.getView().byId('dateRequest').focus();
                return;
            }
            // costCenter
           /* if (costCen == null || $.trim(costCen) == "") {
                this.getView().byId('costCenter').setValueState("Error");
                this.getView().byId('costCenter').focus();
                return;
            }*/
            var that = this;
            var aFilter = [];
            var f1 = new sap.ui.model.Filter({
                path : "RDATE",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : dateVal,
                value2 : ""
            });                                                                 
            var f2 = new sap.ui.model.Filter({
            	path : "MATNR",
            	operator : sap.ui.model.FilterOperator.Contains,
            	value1 : maIdNumber,
            	value2 : ""
            });
            var f3 = new sap.ui.model.Filter({
                path : "KOSTL",
                operator : sap.ui.model.FilterOperator.Contains,
                value1 : costCen,
                value2 : ""
            });
            var f4 = new sap.ui.model.Filter({
                path : "RUSER",
                operator : sap.ui.model.FilterOperator.Contains,
                value1 : requesterVal,
                value2 : ""
            });
            var f5 = new sap.ui.model.Filter({
            	path : "WERKS",
            	operator : sap.ui.model.FilterOperator.EQ,
            	value1 : plant,
            	value2 : ""
            });
            aFilter.push(f1);
            aFilter.push(f2);
            aFilter.push(f3);
            aFilter.push(f4);
            aFilter.push(f5);
            this.fShowBusyIndicator();
            oModel.read("/RequestSet/", {
                async : false,
                filters : aFilter,
                success : function(oERP) {
                	var sCount1 = 0;
                	var sCount2 = 0;
                    that.fHideBusyIndicator();
                    if (oERP.results[0].MSGTY == "E") {
                    	that._setBtonEnableF();
                    	if(msgStatus == 'ismsg'){
                    		that.fShowMessageBox('error', oERP.results[0].MSGCT);
                    	}
                        that.getView().byId("table").setModel(new JSONModel([]));
                        that.getView().setModel(new JSONModel());
                        return;
                    } else if (oERP.results[0].MSGTY == "S") {
                        sCount = oERP.results.length;
                        that._setEnableBtnT();
                        // search field
                        for ( var i in oERP.results) {
                        	var costk = oERP.results[i].COSTK;
                            var vbeln = oERP.results[i].VBELN;
                            var rdate = oERP.results[i].RDATE;
                            var ruser = oERP.results[i].RUSER;
                            var adate = oERP.results[i].ADATE;
                            var total = oERP.results[i].TOTAL;
                            if(costk == "0"){
                            	sCount1 ++;
                            	oERP.results[i].filter0 = vbeln + rdate + ruser + adate + total;
                            }else if(costk == "1"){
                            	sCount2 ++;
                            	oERP.results[i].filter1 = vbeln + rdate + ruser + adate + total;
                            };
                        }
                        that.getView().byId("notProveBtId").setCount(sCount1);
                        that.getView().byId("provedBtId").setCount(sCount2);
                        
                        var oTable = that.getView().byId('table');
                        var oModel = new JSONModel(oERP);
                        oTable.setModel(oModel);
                        
                        var oAprbinding = oTable.getBinding("items");
                        var aFilters = [];
                        aFilters[0] = new Filter("COSTK", sap.ui.model.FilterOperator.EQ, "0");
                        // update list binding
                        oAprbinding.filter(aFilters, "Application");
        				if(sCount1 == 0 && sCount2 > 0){
        					aFilters[1] = new Filter("COSTK", sap.ui.model.FilterOperator.EQ, "1");
        					// update list binding
                            oAprbinding.filter(aFilters, "Application");
        					that.getView().byId('iconTabBar').setSelectedKey("1");
        					that.getView().byId('notProveBtId').setEnabled(false);
        					that._showCancelAprBt();
        				}else if(sCount1 > 0 && sCount2 == 0){
        					that.getView().byId('provedBtId').setEnabled(false);
        				}else if(sCount1 == 0 && sCount2 == 0){
        					that._setBtonEnableF();
        				}
                    }
                },
                error : function(oError) {
                    that.fHideBusyIndicator();
                    that.getView().setModel(new JSONModel());
                    if(msgStatus == 'ismsg'){
                    	that.fShowMessageBox('error', oError.message);
                    }
                }
            });
        },
        // confirm, alert, error, information, warning, success
        fShowMessageBox : function(type, content) {
            var oI18n = this.getView().getModel("i18n").getResourceBundle();
            var bCompact = !!this.getView().$().closest(".sapUiSizeCozy").length;
            var Options = null;
            if (type == 'none') {
                Options = {
                    icon : sap.m.MessageBox.Icon.NONE,
                    title : oI18n.getText("noneBox"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            } else if (type == 'question') {
                Options = {
                    icon : sap.m.MessageBox.Icon.QUESTION,
                    title : oI18n.getText("questionBox"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            } else if (type == 'error') {
                Options = {
                    icon : sap.m.MessageBox.Icon.ERROR,
                    title : oI18n.getText("boxError"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            } else if (type == 'information') {
                Options = {
                    icon : sap.m.MessageBox.Icon.INFORMATION,
                    title : oI18n.getText("informationBox"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            } else if (type == 'warning') {
                Options = {
                    icon : sap.m.MessageBox.Icon.WARNING,
                    title : oI18n.getText("WARNING"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            } else if (type == 'success') {
                Options = {
                    icon : sap.m.MessageBox.Icon.SUCCESS,
                    title : oI18n.getText("boxSuccess"),
                    actions : sap.m.MessageBox.Action.OK,
                    onClose : null,
                    styleClass : bCompact ? "sapUiSizeCozy" : "",
                    initialFocus : null,
                    textDirection : sap.ui.core.TextDirection.Inherit
                };
            }
            sap.m.MessageBox.show(content, Options);
        },
        //BusyDialog control
        fHideBusyIndicator : function() {
            var oDialog = sap.ui.getCore().byId('BusyDialog');
            if (oDialog) {
                oDialog.close();
            }
        },
        fShowBusyIndicator : function() {
            var oDialog = sap.ui.getCore().byId('BusyDialog');
            if (!oDialog) {
                oDialog = new sap.m.BusyDialog('BusyDialog');
            }
            oDialog.open();
        },
        //Warning before delete 
        //bottom reject/delete button
        onDelItems: function(){
        	var aSelectedItems, i, oSelected, oSelectedLists, delAprItems, submitUrl;
        	var arrSelectedType = [];
			aSelectedItems = this.getView().byId("table").getSelectedItems();
			if (aSelectedItems.length) {
				for (i = 0; i < aSelectedItems.length; i++) {
					oSelected = aSelectedItems[i];
					oSelectedLists = oSelected.getBindingContext().getProperty();
					arrSelectedType[i] = defaultData.WERKS + '@$&' + oSelectedLists.VBELN;
				}
				submitUrl = '/RejectSet/';
				delAprItems = arrSelectedType.join("|") + '|';
				this.warningMsgDialog("WARNING","warningMsg",delAprItems,submitUrl);
			} else {
				this.fShowMessageBox('warning', this.getModel("i18n").getResourceBundle().getText("TableSelectProduct"));
			}
        },
		//Approve items
		onApprove : function(){
        	var aSelectedItems, i, oSelected, oSelectedLists, aprSelectedItems, submitUrl;
        	var aprSelectedType = [];
			aSelectedItems = this.getView().byId("table").getSelectedItems();
			if (aSelectedItems.length) {
				for (i = 0; i < aSelectedItems.length; i++) {
					oSelected = aSelectedItems[i];
					oSelectedLists = oSelected.getBindingContext().getProperty();
					aprSelectedType[i] = defaultData.WERKS + '@$&' + oSelectedLists.VBELN;
				}
				submitUrl = '/ApproveSet/';
				aprSelectedItems = aprSelectedType.join("|") + '|';
				this.warningMsgDialog("WARNING","warningApr",aprSelectedItems,submitUrl);
			} else {
				this.fShowMessageBox('warning', this.getModel("i18n").getResourceBundle().getText("TableSelectProduct"));
			}
        },
        //Cancel approved
        onCancelApro : function(){
        	var aSelectedItems, i, oSelected, oSelectedLists, cancelAprItems, submitUrl;
        	var cancelAprSelectedType = [];
			aSelectedItems = this.getView().byId("table").getSelectedItems();
			if (aSelectedItems.length) {
				for (i = 0; i < aSelectedItems.length; i++) {
					oSelected = aSelectedItems[i];
					oSelectedLists = oSelected.getBindingContext().getProperty();
					cancelAprSelectedType[i] = defaultData.WERKS + '@$&' + oSelectedLists.VBELN;
				}
				submitUrl = '/DeleteSet/';
				cancelAprItems = cancelAprSelectedType.join("|") + '|';
				this.warningMsgDialog("WARNING","warningAprCancel",cancelAprItems,submitUrl);
			} else {
				this.fShowMessageBox('warning', this.getModel("i18n").getResourceBundle().getText("TableSelectProduct"));
			}
        },
        /**
		 * Warning before operation of reject,approve,cancel approved.
		 * @public
		 * @param sMsgTitle : Title of Dialog
				  sMsg : Warning content
				  itemsMsg : data back to DB
				  sUrl : DB's url
		 */
        warningMsgDialog : function(sMsgTitle,sMsg,itemsMsg,sUrl){
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
						var sData = {'LINE':itemsMsg};
						oModel.create(sUrl + "?" + oTimeStap, sData,{
							async : false,
		                    success: function(oData){
		                  	  if(oData.MSGTY == "E"){
		                  		  that.fShowMessageBox('error', oData.MSGCT);
		                  	  }else if(oData.MSGTY == "S"){
		                  		  that.fShowMessageBox('success', oI18n.getText("successMsg"));
		                  		  that.onBottomSearch('nomsg');
		                  	  }
		                    },
		                    error: function(oError){
		      	              that.fShowMessageBox('error', oError.message);
		                    }
						});
						dialog.close();
						//parameter 'nomsg' means method onBottomSearch() don't show 'No Data' Dialog when result is empty
					}
				}),
				endButton: new sap.m.Button({
					text: oI18n.getText("cancelBtn"),
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function() {
					//The delete operation of after confirm
					dialog.destroy();
				}
			});
			dialog.open();
		},
		//table-columns show counts
        onSetTabColumns : function(oEvent) {
            this._oTPC.openDialog();
        },
		//Nav to next detail page----not use now
		onSelectionChange: function(oEvent) {
			// The source is the list item that got pressed
			this._showObject(oEvent.getSource());
		},
		_showObject: function(oItem) {
			var oTable = this.getView().byId('table');
            var sPath = oItem.getBindingContext().getPath();
            var oModel = oTable.getModel();
            var _MaRequestHome = new JSONModel({
            	COSTK: oModel.getProperty(sPath).COSTK,
            	WERKS: defaultData.WERKS
            });
            this.getOwnerComponent().setModel(_MaRequestHome, 'MaRequestHome');
			//var testVal = oItem.getBindingContext().getProperty("COSTK");
			this.getRouter().navTo("madetail", {
				VBELN: oModel.getProperty(sPath).VBELN
				//COSTK: oItem.getBindingContext().getProperty("COSTK")
			});
		},
    });
});