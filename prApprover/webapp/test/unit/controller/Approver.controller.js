/*global QUnit*/

sap.ui.define([
	"compr/prApprover/controller/Approver.controller"
], function (Controller) {
	"use strict";

	QUnit.module("Approver Controller");

	QUnit.test("I should test the Approver controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
