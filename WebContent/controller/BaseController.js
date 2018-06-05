sap.ui.define(
		[
         "sap/ui/core/mvc/Controller",
         ],
         function(Controller) {
			"use strict";
		    return Controller.extend("sap.ui.mmf070.wt.controller.BaseController",{
		        getRouter : function() {
		            return sap.ui.core.UIComponent.getRouterFor(this);
		        },
		         /**
				 * Convenience method for getting the view model by name.
				 * @public
				 * @param {string} [sName] the model name
				 * @returns {sap.ui.model.Model} the model instance
				 */
				getModel: function(sName) {
					return this.getView().getModel(sName);
				},
		    });
});
