import React, { Component } from 'react';
import html2pdf from 'html2pdf.js/src';
import PropTypes from 'prop-types';
import {
  Well, Panel, ListGroup, ListGroupItem, ButtonToolbar, Button,
  Tabs, Tab, Tooltip, OverlayTrigger, Col, Row
} from 'react-bootstrap';
import { findIndex } from 'lodash';
import Immutable from 'immutable';
import LoadingActions from './actions/LoadingActions';
import ElementCollectionLabels from './ElementCollectionLabels';
import ElementActions from './actions/ElementActions';
import DetailActions from './actions/DetailActions';
import Wellplate from './Wellplate';
import WellplateList from './WellplateList';
import WellplateProperties from './WellplateProperties';
import WellplateDetailsContainers from './WellplateDetailsContainers';
import WellplateDetailsAttachments from './WellplateDetailsAttachments';
import PrintCodeButton from './common/PrintCodeButton';
import Attachment from './models/Attachment';
import Utils from './utils/Functions';
import UIStore from './stores/UIStore';
import UIActions from './actions/UIActions';
import ConfirmClose from './common/ConfirmClose';
import ExportSamplesBtn from './ExportSamplesBtn';
import ElementDetailSortTab from './ElementDetailSortTab';
import { addSegmentTabs } from './generic/SegmentDetails';

const cols = 12;

export default class WellplateDetails extends Component {
  constructor(props) {
    super(props);
    const { wellplate } = props;
    this.state = {
      wellplate,
      activeTab: UIStore.getState().wellplate.activeTab,
      showWellplate: true,
      visible: Immutable.List(),
    };
    this.onUIStoreChange = this.onUIStoreChange.bind(this);
    this.onTabPositionChanged = this.onTabPositionChanged.bind(this);
    this.handleSegmentsChange = this.handleSegmentsChange.bind(this);
  }

  componentDidMount() {
    UIStore.listen(this.onUIStoreChange);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { wellplate } = this.state;
    const nextWellplate = nextProps.wellplate;
    if (nextWellplate.id !== wellplate.id || nextWellplate.updated_at !== wellplate.updated_at) {
      this.setState({
        wellplate: nextWellplate
      });
    }
  }

  componentWillUnmount() {
    UIStore.unlisten(this.onUIStoreChange);
  }

  onUIStoreChange(state) {
    if (state.wellplate.activeTab !== this.state.activeTab) {
      this.setState({
        activeTab: state.wellplate.activeTab
      });
    }
  }

  handleSegmentsChange(se) {
    const { wellplate } = this.state;
    const { segments } = wellplate;
    const idx = findIndex(segments, o => o.segment_klass_id === se.segment_klass_id);
    if (idx >= 0) { segments.splice(idx, 1, se); } else { segments.push(se); }
    wellplate.segments = segments;
    wellplate.changed = true;
    this.setState({ wellplate });
  }

  onTabPositionChanged(visible) {
    this.setState({ visible });
  }

  handleSubmit() {
    const { wellplate } = this.state;
    LoadingActions.start();
    if (wellplate.isNew) {
      ElementActions.createWellplate(wellplate);
    } else {
      ElementActions.updateWellplate(wellplate);
    }
    if (wellplate.is_new) {
      const force = true;
      DetailActions.close(wellplate, force);
    }
    wellplate.updateChecksum();
  }

  handleWellplateChanged(wellplate) {
    this.setState({
      wellplate
    });
  }

  handlePrint() {
    const element = document.getElementById('wellplate-designer');
    if (element) {
      const opt = { filename: `${this.state.wellplate.name}-wells.pdf` };
      html2pdf(element, opt);
    }
  }

  handleWellsChange(wells) {
    const { wellplate } = this.state;
    wellplate.wells = wells;
    this.setState({ wellplate });
  }

  handleAddReadout() {
    const { wellplate } = this.state;
    wellplate.wells.forEach((well) => {
      well.readouts.push({ title: '', value: '', unit: '' });
    });
    this.setState({ wellplate });
  }

  handleRemoveReadout(index) {
    const { wellplate } = this.state;
    wellplate.wells.forEach((well) => {
      well.readouts.splice(index, 1);
    });
    this.setState({ wellplate });
  }

  handleChangeProperties(change) {
    const { wellplate } = this.state;
    const { type, value } = change;
    switch (type) {
      case 'name':
        wellplate.name = value === '' ? 'New Wellplate' : value;
        break;
      case 'description':
        wellplate.description = value;
        break;
      case 'readoutTitles':
        wellplate.readout_titles = value;
        break;
      default:
        break;
    }
    this.setState({ wellplate });
  }

  handleTabChange(eventKey) {
    const showWellplate = (eventKey === 0);
    this.setState(previousState => ({ ...previousState, activeTab: eventKey, showWellplate }));
    UIActions.selectTab({ tabKey: eventKey, type: 'wellplate' });
  }

  // handle attachment actions

  handleAttachmentDrop(files) {
    const { wellplate } = this.state;
    wellplate.changed = true;
    files.forEach((file) => {
      const attachment = Attachment.fromFile(file);
      wellplate.attachments.push(attachment);
    });
    this.setState({ wellplate });
  }

  handleAttachmentDelete(attachment) {
    const { wellplate } = this.state;
    const index = wellplate.attachments.indexOf(attachment);
    wellplate.changed = true;
    wellplate.attachments[index].is_deleted = true;
    this.setState({ wellplate });
  }

  handleAttachmentImport(attachment) {
    // TODO: implement this stuff
    const { wellplate } = this.state;
    const index = wellplate.attachments.indexOf(attachment);
    // wellplate.changed = true;
    // wellplate.attachments[index].is_deleted = true;
    // this.setState({ wellplate });
    console.log(`wellplate: ${index}`);
    // return index;
  }

  handleAttachmentUndoDelete(attachment) {
    const { wellplate } = this.state;
    const index = wellplate.attachments.indexOf(attachment);
    wellplate.attachments[index].is_deleted = false;
    this.setState({ wellplate });
  }

  handleAttachmentDownload(attachment) { // eslint-disable-line class-methods-use-this
    Utils.downloadFile({ contents: `/api/v1/attachments/${attachment.id}`, name: attachment.filename });
  }

  handleAttachmentEdit(attachment) {
    const { wellplate } = this.state;

    // update only this attachment
    wellplate.attachments.map((currentAttachment) => {
      if (currentAttachment.id === attachment.id) return attachment;
    });
    this.setState({ wellplate });
    this.forceUpdate();
  }

  wellplateHeader(wellplate) {
    const saveBtnDisplay = wellplate.isEdited ? '' : 'none';
    const datetp = `Created at: ${wellplate.created_at} \n Updated at: ${wellplate.updated_at}`;


    return (
      <div>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="screenDatesx">{datetp}</Tooltip>}>
          <span>
            <i className="icon-wellplate" />
            &nbsp; <span>{wellplate.name}</span> &nbsp;
          </span>
        </OverlayTrigger>
        <ElementCollectionLabels element={wellplate} placement="right" />
        <ConfirmClose el={wellplate} />
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="saveWellplate">Save Wellplate</Tooltip>}>
          <Button bsStyle="warning" bsSize="xsmall" className="button-right" onClick={() => this.handleSubmit()} style={{ display: saveBtnDisplay }}>
            <i className="fa fa-floppy-o " />
          </Button>
        </OverlayTrigger>
        <OverlayTrigger placement="bottom" overlay={<Tooltip id="fullSample">FullScreen</Tooltip>}>
          <Button bsStyle="info" bsSize="xsmall" className="button-right" onClick={() => this.props.toggleFullScreen()}>
            <i className="fa fa-expand" />
          </Button>
        </OverlayTrigger>
        <PrintCodeButton element={wellplate} />
      </div>
    );
  }

  renderAttachmentsTab(wellplate) { /* eslint-disable react/jsx-no-bind */
    const { attachments } = wellplate;
    return (
      <ListGroup fill="true">
        <ListGroupItem >
          <WellplateDetailsAttachments
            attachments={attachments}
            onDrop={this.handleAttachmentDrop.bind(this)}
            onDelete={this.handleAttachmentDelete.bind(this)}
            onUndoDelete={this.handleAttachmentUndoDelete.bind(this)}
            onDownload={this.handleAttachmentDownload.bind(this)}
            onImport={this.handleAttachmentImport.bind(this)}
            onEdit={this.handleAttachmentEdit.bind(this)}
            readOnly={false}
          />
        </ListGroupItem>
      </ListGroup>
    );
  } /* eslint-enable */


  render() {
    const {
      wellplate, showWellplate, visible
    } = this.state;
    const {
      wells, name, size, description
    } = wellplate;
    const readoutTitles = wellplate.readout_titles;
    const submitLabel = wellplate.isNew ? 'Create' : 'Save';
    const exportButton = (wellplate && wellplate.isNew) ? null : <ExportSamplesBtn type="wellplate" id={wellplate.id} />;
    const properties = {
      name, size, description, readoutTitles
    };

    const tabContentsMap = {
      designer: (
        <Tab eventKey="designer" title="Designer" key={`designer_${wellplate.id}`}>
          <Row className="wellplate-detail">
            <Col md={10}>
              <Well id="wellplate-designer">
                <Wellplate
                  show={showWellplate}
                  size={size}
                  readoutTitles={readoutTitles}
                  wells={wells}
                  handleWellsChange={w => this.handleWellsChange(w)}
                  cols={cols}
                  width={60}
                />
              </Well>
            </Col>
          </Row>
        </Tab>
      ),
      list: (
        <Tab eventKey="list" title="List" key={`list_${wellplate.id}`}>
          <Well>
            <WellplateList
              wells={wells}
              readoutTitles={readoutTitles}
              handleWellsChange={w => this.handleWellsChange(w)}
            />
          </Well>
        </Tab>
      ),
      properties: (
        <Tab eventKey="properties" title="Properties" key={`properties_${wellplate.id}`}>
          <WellplateProperties
            {...properties}
            changeProperties={c => this.handleChangeProperties(c)}
            handleAddReadout={c => this.handleAddReadout(c)}
            handleRemoveReadout={c => this.handleRemoveReadout(c)}
          />
        </Tab>
      ),
      analyses: (
        <Tab eventKey="analyses" title="Analyses" key={`analyses_${wellplate.id}`}>
          <ListGroupItem style={{ paddingBottom: 20 }}>
            <WellplateDetailsContainers
              wellplate={wellplate}
              parent={this}
            />
          </ListGroupItem>
        </Tab>
      ),
      attachments: (
        <Tab eventKey="attachments" title="Attachments" key={`attachments_${wellplate.id}`}>
          {this.renderAttachmentsTab(wellplate)}
        </Tab>
      ),

    };

    const tabTitlesMap = {
    };
    addSegmentTabs(wellplate, this.handleSegmentsChange, tabContentsMap);

    const tabContents = [];
    visible.forEach((value) => {
      const tabContent = tabContentsMap[value];
      if (tabContent) { tabContents.push(tabContent); }
    });

    const activeTab = (this.state.activeTab !== 0 && this.state.activeTab) || visible[0];

    return (
      <Panel bsStyle={wellplate.isPendingToSave ? 'info' : 'primary'} className="eln-panel-detail">
        <Panel.Heading>{this.wellplateHeader(wellplate)}</Panel.Heading>
        <Panel.Body>
          <ElementDetailSortTab
            type="wellplate"
            availableTabs={Object.keys(tabContentsMap)}
            tabTitles={tabTitlesMap}
            onTabPositionChanged={this.onTabPositionChanged}
          />
          <Tabs activeKey={activeTab} onSelect={event => this.handleTabChange(event)} id="wellplateDetailsTab">
            {tabContents}
          </Tabs>
          <ButtonToolbar>
            <Button bsStyle="primary" onClick={() => DetailActions.close(wellplate)}>
              Close
            </Button>
            <Button bsStyle="warning" onClick={() => this.handleSubmit()}>
              {submitLabel}
            </Button>
            {exportButton}
            <Button bsStyle="primary" onClick={() => this.handlePrint()}>
              Print Wells
            </Button>
          </ButtonToolbar>
        </Panel.Body>
      </Panel>
    );
  }
}

WellplateDetails.propTypes = { /* eslint-disable react/forbid-prop-types */
  wellplate: PropTypes.object.isRequired,
  toggleFullScreen: PropTypes.func.isRequired,
};
