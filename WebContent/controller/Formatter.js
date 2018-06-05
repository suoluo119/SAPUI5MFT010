sap.ui.define(function() {
    "use strict";
    //format Date - YYYY/MM/dd
    function formatD(valDate){
    	if(valDate.length == 8){//Method one
    		return valDate.substring(0, 4) + "/" + valDate.substring(4, 6) + "/" + valDate.substring(6, 8);
		} else if(valDate.length == 6){
    		return valDate.substring(0, 4) + "/" + valDate.substring(4, 6);
		} else {
    		return valDate;	
		}
    };
    function formatDt(valDate){//Method two
    	var pattern = /(\d{4})(\d{2})(\d{2})/;
    	var formatedDate = valDate.replace(pattern, "$1/$2/$3");
    	return formatedDate;
    };//end
    
    var Formatter = {
        valueDate: function(svalueDate){
            if (svalueDate === "00000000") {
                return "";
            } else {
                return svalueDate;
            }
        },
        status: function(phantomflag){
            if (COSTK === "0") {
                return "Not Approve";
            } else {
                return "Approved" ;
            }
        },
        total: function (numVal){//截取小数点后两位,四舍五入 var numVal = 10.15;
        	var endTotal;
        	if($.trim(numVal) == "" || $.trim(numVal) == null){
        		endTotal = "";
        	}else{
        		if(typeof numVal === "number"){
        			endTotal = numVal.toFixed(2);
        		}else{
        			var numTotal = parseFloat($.trim(numVal));
        			endTotal = numTotal.toFixed(2);
        		}
        	}
        	return endTotal;
        }
    };
    return Formatter;
}, /* bExport= */true);