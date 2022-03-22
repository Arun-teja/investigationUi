/*global QUnit*/

sap.ui.define([
	"compr/prInvestigation/controller/investigation.controller"
], function (Controller) {
	"use strict";

	QUnit.module("investigation Controller");

	QUnit.test("I should test the investigation controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
