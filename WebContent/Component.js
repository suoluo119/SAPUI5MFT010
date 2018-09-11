sap.ui.define(
	[
		"sap/ui/core/UIComponent",
		"sap/ui/model/resource/ResourceModel",
	],
	function (UIComponent, ResourceModel) {
		"use strict";
		return UIComponent.extend("sap.ui.mft010.wt.Component", {
			// manifest set
			metadata: {
				manifest: "json",
			},
			// initial function
			init: function () {
				// call the init function of the parent
				UIComponent.prototype.init.apply(this, arguments);
				this.getRouter().initialize();
				// initial i18n
				this.setModel(new ResourceModel({
					bundleName: "sap.ui.mft010.wt.i18n.i18n"
				}), "i18n");
			},
		});
	});