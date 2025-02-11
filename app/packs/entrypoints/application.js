// see https://github.com/rackt/react-router/issues/1067

var React = require('react');
var Home = require('../src/libHome/Home');
var CnC = require('../src/libCnC/CnC');
var AdminHome = require('../src/admin/AdminHome');
var ChemScanner = require('../src/components/chemscanner/ChemScanner');
var ChemSpectra = require('../src/components/chemspectra/ChemSpectra');
var ChemSpectraEditor = require('../src/components/chemspectra/ChemSpectraEditor');
var MoleculeModerator = require('../src/components/MoleculeModerator');
var OmniauthCredential = require('../src/components/sso/OmniauthCredential');
var UserCounter = require('../src/components/elements/UserCounter');
var ScifinderCredential = require('../src/components/scifinder/ScifinderCredential');
var mydb = require('../src/components/App');

