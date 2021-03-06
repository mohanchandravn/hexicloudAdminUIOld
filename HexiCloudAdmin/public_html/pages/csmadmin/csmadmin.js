/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

define(['knockout',
    'config/serviceConfig',
    'ojs/ojcore',
    'jquery',
    'ojs/ojknockout',
    'ojs/ojknockout-validation',
    'ojs/ojradioset',
    'ojs/ojbutton',
    'ojs/ojselectcombobox',
    'ojs/ojtabs',
    'ojs/ojtable',
    'ojs/ojdialog',
    'ojs/ojinputtext',
    'ojs/ojinputnumber',
    'ojs/ojarraytabledatasource'],
        function (ko, service, oj, $) {

            function csmadminViewModel(params) {
                var self = this;
                var router = params.ojRouter.parentRouter;

                // this is the invalidComponentTracker on ojRadioset
                self.tracker = ko.observable();

                //step codes to detect user in which step he's in
                self.stepsArray = ko.observableArray([]);
                self.selectedStepId = ko.observable('');
                self.displayOrder = ko.observable();
                self.displayLabel = ko.observable('');
                self.showSubSteps = ko.observable(false);
                self.subStepsArray = ko.observableArray([]);

                self.allStepsList = ko.computed(function () {
                    var array = [];
                    for (var idx = 0; idx < self.stepsArray().length; idx++) {
                        array.push({value: self.stepsArray()[idx].stepId, label: self.stepsArray()[idx].stepLabel});
                    }
                    return array.sort(function (a, b) {
                        if (a.label < b.label)
                            return -1;
                        if (a.label > b.label)
                            return 1;
                        return 0;
                    });
                });

                self.stepDetailTableArray = ko.observableArray([]);
                self.datasource = ko.observable();
                self.selectedSubStep = ko.observable();
                self.successCbText = ko.observable();
                self.failCbText = ko.observable();

                var getApplicationStepsSuccessCbFn = function (data) {
                    console.log(data);
                    initializeStepsArray(data);
                };

                var getFileDetailsSuccessFn = function (data, status) {
                    if (status !== 'nocontent') {
                        console.log(data);
                        self.stepDetailTableArray([]);
                        var array = [];
                        for (var idx = 0; idx < data.length; idx++) {
                            array.push({
                                stepId: data[idx].stepId,
                                stepCode: data[idx].stepCode,
                                docType: data[idx].docType,
                                docTypeExtn: data[idx].docTypeExtn,
                                fileId: data[idx].docFileId,
                                docMetaData: data[idx].docMetaData,
                                fileName: data[idx].fileName,
                                linkId: data[idx].publicLinkId});
                        }
                        self.stepDetailTableArray(array);
                        self.datasource(new oj.ArrayTableDataSource(self.stepDetailTableArray));
                    } else {
                        console.log('Content not available for the selected step');
                        self.stepDetailTableArray([]);
                        self.datasource(new oj.ArrayTableDataSource(self.stepDetailTableArray));
                    }
                };

                var addStepDocumentSuccessFn = function (data, status) {
                    hidePreloader();
                    self.successCbText('Details has been added to STEP_DOCUMENTS table successfully.');
                    $("#successCallback").fadeIn();
                    $("#successCallback").fadeOut(3000);
                    console.log(status);
                    console.log(data);
                    self.displayContentByStepId(self.selectedStepId()[0]);
                };

                var getStepCodeById = function (stepId) {
                    for (var key in self.stepsArray()) {
                        var value = self.stepsArray()[key];
                        if (stepId === value.stepId) {
                            console.log(value.stepCode);
                            return value.stepCode;
                        }
                    }
                };

                var checkForSubsteps = function (stepId) {
                    for (var key in self.stepsArray()) {
                        var value = self.stepsArray()[key];
                        if (stepId === value.stepId) {
                            console.log(value.hasSubStep);
                            return value.hasSubStep;
                        }
                    }
                };

                var getSubStepsForRadio = function (stepId) {
                    for (var key in self.stepsArray()) {
                        var value = self.stepsArray()[key];
                        if (stepId === value.stepId) {
                            console.log(value.subSteps);
                            var subStepsArray = [];
                            for (var idx = 0; idx < value.subSteps.length; idx++) {
                                subStepsArray.push({value: value.subSteps[idx].subStepCode, label: value.subSteps[idx].subStepLabel});
                            }
                            return subStepsArray;
                        }
                    }
                };

                var createPublicLinkSuccessFn = function (linkId, fileId, fileName) {
                    console.log("created public link..");
                    hidePreloader();
                    self.successCbText('Public link created successfully.');
                    $("#successCallback").fadeIn();
                    $("#successCallback").fadeOut(3000);
                    console.log(linkId);
                    console.log(fileId);
                    console.log(fileName);
                    console.log(self.selectedStepId()[0]);
                    var payload = {
                        "stepId": self.selectedStepId()[0],
                        "stepCode": getStepCodeById(self.selectedStepId()[0]),
                        "docType": "File",
                        "docTypeExtn": "pdf",
                        "docFileId": fileId,
                        "docMetaData": "meta data for the create service test",
                        "fileName": fileName,
                        "publicLinkId": linkId
                    };
                    showPreloader();
                    console.log(payload);
                    service.addStepDocument(JSON.stringify(payload)).then(addStepDocumentSuccessFn, failCbFn);
                };

                var fileUploadSuccessCbFn = function (data, status) {
                    console.log("File uploaded..");
                    console.log(status);
                    console.log(data);
                    var fileId = data.id;
                    var filename = data.name;
                    var fileName = filename.split(".");

                    // clearing the file field
                    $("#fileUploadInput").val("");
                    $("#displayOrder").val("");
                    $("#displayLabel").val("");

                    hidePreloader();
                    self.successCbText('Files uploaded successfully.');
                    $("#successCallback").fadeIn();
                    $("#successCallback").fadeOut(3000);
//                    $("#uploadDialog").ojDialog("close");
                    //showPreloader();
//                    service.createPublicLink(fileId, fileName[0]).then(createPublicLinkSuccessFn, failCbFn);
                };

                var fileUploadFailCbFn = function (xhr) {
                    console.log(xhr);
                    hidePreloader();
                    self.failCbText('File upload failed.');
                    $("#failCallback").fadeIn();
                    $("#failCallback").fadeOut(3000);
                };

                //for normal call fail callbacks
                var failCbFn = function (xhr) {
                    console.log(xhr);
                    hidePreloader();
                    self.failCbText('AJAX call failed.');
                    $("#failCallback").fadeIn();
                    $("#failCallback").fadeOut(3000);
                };

                self.updateStepCode = function (event, data) {
                    self.selectedSubStep('');
                    if (data.value[0] !== undefined && data.option === "value") {
                        if (checkForSubsteps(data.value[0]) == 'Y') {
                            self.showSubSteps(true);
                            self.subStepsArray(getSubStepsForRadio(data.value[0]));
                        } else {
                            self.showSubSteps(false);
                        }
                        self.displayContentByStepCodeAndSubStep(data.value[0],null);
                    } else {
                        self.stepDetailTableArray([]);
                        self.datasource(new oj.ArrayTableDataSource(self.stepDetailTableArray));
                    }
                };

                self.updatedSubStep = function (event, data) {
                    if (data.value[0] !== undefined && data.option === "value") {
                     
                        self.displayContentByStepCodeAndSubStep(getStepCodeById(self.selectedStepId()[0]),data.value[0]);
                    } else {
                         self.displayContentByStepCodeAndSubStep(getStepCodeById(self.selectedStepId()[0]),null);
                    }
                };

                self.displayContentByStepId = function (stepId) {
                    service.getFileDetails(stepId, null).then(getFileDetailsSuccessFn, failCbFn);
                };

                self.displayContentByStepCodeAndSubStep = function (stepCode, subStepCode) {
                    service.getFileDetails(stepCode, subStepCode).then(getFileDetailsSuccessFn, failCbFn);
                };

                function initializeStepsArray(stepsData) {
                    var temp = [];
                    for (var step in stepsData) {
                        temp.push({'stepId': stepsData[step].stepId, 'stepCode': stepsData[step].stepCode, 'stepLabel': stepsData[step].stepLabel, 'hasSubStep': stepsData[step].hasSubStep, 'subSteps': stepsData[step].subSteps});
                    }
                    self.stepsArray(temp);
                }
                ;

                self.openDialogForUpload = function () {
                    $("#uploadDialog").ojDialog("open");
                };

                // for uploading file
                self.onUploadFile = function() {
            var fileData = $("#fileUploadInput");
            var file = fileData[0].files[0];
            
            if (file !== undefined && (file.type === "application/pdf" || file.type === "video/mp4" || file.type === "image/jpeg" || file.type === "image/png")) {
                showPreloader();
                var payload = new FormData();
                var stepId = self.selectedStepId()[0];
                var stepCode = getStepCodeById(stepId);
//                var temp = "{ \"parentID\": \"self\", \"stepId\": \"" + stepId + "\", \"stepCode\" : \"" + stepCode + "\", \"displayOrder\": \"" + self.displayOrder() + "\", \"displayLabel\" : \"" + self.displayLabel() + "\"  }";
//                console.log(temp);//selectedSubStep
                payload.append("jsonInputParameters", "{ \"parentID\": \"self\", \"stepId\": \"" + stepId + "\", \"stepCode\" : \"" + stepCode + "\", \"displayOrder\": \"" + self.displayOrder() + "\", \"displayLabel\" : \"" + self.displayLabel() + "\", \"displayOrder\": \"" + self.displayOrder() + "\", \"subStepCode\" : \"" + self.selectedSubStep() + "\"  }");
                payload.append("primaryFile", file);
                service.uploadFile(payload).then(fileUploadSuccessCbFn, fileUploadFailCbFn);
            } else {
                alert("Please upload PDF, MP4 Video, JPG/PNG formats only.");
            }
        };

                self.onCancelUpload = function () {
                    $("#uploadDialog").ojDialog("close");
                };

//        self.downloadContent = function(stepId) {
//            var fetchedLinkId = "";
//            
//            var linkIdSuccessFn = function(data, fileId, docType) {
//                console.log('linkId success');
//                console.log(data + fileId + docType);
//                fetchedLinkId = data;
//                if (docType === 'Video') {
//                    self.videoSrc(service.serverURI() + fetchedLinkId + "/file/" + fileId);
//                    self.isVideoFetched(true);
//                } else if (docType === 'File') {
//                    self.pdfSrc(service.serverURI() + fetchedLinkId + "/file/" + fileId);
//                    self.isPdfFetched(true);
//                }
//            };
//
//            var linkIdFailFn = function(xhr) {
//                console.log('linkId failed');
//                console.log(xhr);
//            };
//
//            var fileDetailsSuccessFn = function(data, status) {
//                console.log('fileId success');
//                console.log(data);
//                console.log(status);
//                if (status !== "nocontent") {
//                    for(var idx = 0; idx < data.length; idx++) {
//                        if (data[idx].docType === 'Link') {
//                           self.urlForAddingUsersAndAssigningRoles(data[idx].docFieldId);
//                       } else if (data[idx].docType === 'Video') {
//                            service.getLinkId(data[idx].docFieldId, data[idx].docType).then(linkIdSuccessFn, linkIdFailFn);
//                        } else if (data[idx].docType === 'File' & data[idx].docTypeExtn === 'pdf') {
//                            service.getLinkId(data[idx].docFieldId, data[idx].docType).then(linkIdSuccessFn, linkIdFailFn);
//                        }
//                    }
//                }
//            };
//
//            var fileDetailsFailFn = function(xhr) {
//                console.log('fileId failed');
//                console.log(xhr);
//            };
//            service.getFileDetails(stepId).then(fileDetailsSuccessFn, fileDetailsFailFn);
//        };

                self.viewDocument= function(data, event) {
            console.log("----------------------------------------");
            console.log("we can view the document by this id");
            console.log(data);
            window.open("https://documents-usoracleam82569.documents.us2.oraclecloud.com/documents/link/" + data.linkId + "/fileview/" + data.fileId + "/" + data.fileName);
            
            // have to open a new tab
            console.log("----------------------------------------");
        };

//        self.deleteContentByStepId= function(data, event) {
//            console.log("----------------------------------------");
//            console.log("we can delete the metadata by this id: " + data.id);
//            console.log("metadata details are: " + ko.toJSON(data));
//            console.log("----------------------------------------");
//        };

                // function that will execute automatically after loading the page content
                self.handleAttached = function () {
                    service.getApplicationSteps().then(getApplicationStepsSuccessCbFn, failCbFn);


                };
            }
            ;

            return csmadminViewModel;
        });
