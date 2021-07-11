import {QrTempletQuery} from './dto/QrTempletQuery';


import {QrTempletDetailDto} from './dto/QrTempletDetailDto';

import {QrConstants} from '../common/QrConstants';
import {TempletDesignService} from './service/TempletDesignService';
import './templates/GroupQueryDesign.css'
import ClickEvent = JQuery.ClickEvent;
import {CustomUi} from 'aolie_core/src/decorator/decorator';
import {BaseComponent} from 'aolie_core/src/uidesign/view/BaseComponent';
import {AutoManagedUI, IManageCenter, EventInterceptor} from 'aolie_core/src/blockui/managedView/AutoManagedUI';
import {ComponentDto} from 'aolie_core/src/uidesign/dto/ComponentDto';
import {GeneralEventListener} from 'aolie_core/src/blockui/event/GeneralEventListener';
import {BlockViewer} from 'aolie_core/src/blockui/uiruntime/BlockViewer';
import {JsTreeInfo, JsTree} from 'aolie_core/src/blockui/JsTree/JsTree';
import {DesignTable} from 'aolie_core/src/uidesign/blockdv/DesignTable';
import {Constants} from 'aolie_core/src/common/Constants';
import {ToolbarInfo, Toolbar, ButtonInfo} from 'aolie_core/src/uidesign/view/JQueryComponent/Toolbar';
import {CodeLevelProvider} from 'aolie_core/src/common/CodeLevelProvider';
import {CommonUtils} from 'aolie_core/src/common/CommonUtils';
import EventBus from 'aolie_core/src/dmdesign/view/EventBus';
import {ManagedUITools} from 'aolie_core/src/blockui/managedView/ManagedUITools';
import {ColumnDto} from 'aolie_core/src/datamodel/dto/ColumnDto';
import {Component} from 'aolie_core/src/blockui/uiruntime/Component';
import {DesignComponent} from 'aolie_core/src/uidesign/blockdv/DesignComponent';
import {Column} from 'aolie_core/src/datamodel/DmRuntime/Column';
import {Alert} from 'aolie_core/src/uidesign/view/JQueryComponent/Alert';
import {UiService} from 'aolie_core/src/blockui/service/UiService';
import {MenuButtonDto} from 'aolie_core/src/sysfunc/menu/dto/MenuButtonDto';
import {PageDetailDto} from 'aolie_core/src/funcdesign/dto/PageDetailDto';
import {SchemaFactory} from 'aolie_core/src/datamodel/SchemaFactory';
import {Dialog} from 'aolie_core/src/blockui/Dialog';


@CustomUi('QrDesignPanel')
export class QrDesignPanel<T> extends BaseComponent<T> implements AutoManagedUI {


    // private lstComponentDto: Array<ComponentDto> = [];
    /**
     *     模板信息
     */
    private templetQuery: QrTempletQuery;
    private $compBody: JQuery;
    private currentDto: ComponentDto;
    private templetId: number;

    private selectListener: GeneralEventListener;
    /**
     *  虚拟的视图
     */

    private blockViewer: BlockViewer;


    /**
     * 已添加的控件树
     */
    private compTree: JsTree<JsTreeInfo>;
    private isMaskTreeChange = false;
    private isMaskPanelSelectChange = false;

    private dTable: DesignTable;
    private dropHandler: (event, data) => void;
    private layoutType = Constants.PositionLayoutType.bootstrapLayout;
    /**
     *  记录面板的宽度和高度,如果是负数,则不记录
     */
    private width = -1;
    private height = -1;

    private manageCenter: IManageCenter;
    private toolbar: Toolbar<ToolbarInfo>;


    private lvlProvider: CodeLevelProvider = CodeLevelProvider.getDefaultCodePro();

    protected createUI(): HTMLElement {
        let $ele = $(require('./templates/QrDesignPanel.html'));
        this.createCompTree();
        $ele.find('.comp-tree').append(this.compTree.getViewUI());
        return $ele.get(0);

    }

    protected initSubControls() {
        this.createToolbar();
    }

    private createToolbar() {
        this.toolbar = new Toolbar<ToolbarInfo>({float: false});
        this.$element.find('.toolbar').append(this.toolbar.getViewUI());
    }

    private createCompTree() {
        this.compTree = new JsTree<JsTreeInfo>({
            textField: 'title',
            idField: 'componentId',
            codeField: 'lvlCode',
            rootName: '视图结构',
            dnd: {
                isDraggable: true,
                onlyDroppable: false,
                isCanDrop: (sourceData, parentNodeId) => {
                    if (!this.blockViewer) {
                        return false;
                    }
                    if (!parentNodeId || parentNodeId === '#') {
                        return false;
                    }
                    return true;
                }
            },
            buttons: [{
                id: 'delete',
                iconClass: 'fa fa-trash',
                hint: '删除',
                clickHandler: (event, data) => {
                    this.deleteComp(data);
                }
            }]
        });
        this.compTree.addSelectListener(this);

    }


    afterComponentAssemble(): void {
        this.$compBody = this.$element.find('.form-body');
        this.$element.find('.split-pane')['splitPane']();
        //       this.compTree.afterComponentAssemble();
        this.dropHandler = (event, data) => {
            if (!this.blockViewer) {
                return;
            }
            /**
             * 这个是放到面板上
             */
            if (this.$element.find('.design-body').find(data.event.target).length > 0
                || data.event.target === this.$element.find('.design-body').get(0)) {
                let component = this.createByColumn(data.data.origin.get_node(data.data.nodes[0]).data);
                this.compTree.setValue(this.blockViewer.getAllComponentDto());
                CommonUtils.readyDo(() => {
                    return this.compTree.isReady()
                }, () => {
                    this.resortComponentByTree();
                    this.selectDesignItem(component.getComponentDto().componentId);
                });

            } else {
                // 这里是控件树自己拖动
                this.resortComponentByTree();
            }
        };

        $(document).on('dnd_stop.vakata.jstree', this.dropHandler);
        this.fireReadyEvent();
        super.afterComponentAssemble();
    }

    /**
     * 收集整理需要保存的数据
     */
    private getAllSaveData() {
        let result = new Array<QrTempletDetailDto>();
        this.blockViewer.getAllComponentDto().forEach((componentDto) => {
            let qrTempletDetailDto = this.templetQuery.findDetailById(componentDto.componentId);
            qrTempletDetailDto.lvlCode = componentDto.lvlCode;
            result.push(qrTempletDetailDto);
        });
        return result;
    }

    protected initEvent() {
        EventBus.addListener(EventBus.SELECT_CHANGE_EVENT, this);
        EventBus.addListener(EventBus.DELETE_COLUMN, this);
    }

    setSelectListener(handler: GeneralEventListener) {
        this.selectListener = handler;
    }

    handleEvent(eventType: string, data: object, source: object) {
        if (eventType === JsTree.EVENT_SELECT_CHANGED) {
            if (!data) {
                return;
            }
            if (!this.isMaskPanelSelectChange) {
                this.isMaskTreeChange = true;
                this.selectDesignItem(data['componentId']);
                this.isMaskTreeChange = false;
            }
            this.currentDto = this.blockViewer.findComponent(data['componentId']).getComponentDto();
            let tempDetail = this.templetQuery.findDetailById(this.currentDto.componentId);
            //如果是table.需要调用一下上级的事件处理
            this.manageCenter.dsSelectChanged(this,
                this.getTableIds()[0], ManagedUITools.getDsKeyValue(this.getTableIds()[0], tempDetail), tempDetail);
        }
    }

    private selectDesignItem(comId) {
        this.currentDto = this.blockViewer.findComponent(comId).getComponentDto();
        CommonUtils.readyDo(() => {
            return this.dTable.isReady()
        }, () => {
            this.dTable.selectCol(comId);
        })


    }

    private createByColumn(colDto: ColumnDto) {
        let component = this.createComponentInfo(colDto);
        let code;
        let lstComponentDto = this.blockViewer.getAllComponentDto();
        if (!lstComponentDto || lstComponentDto.length < 1) {
            this.lvlProvider.setCurCode('');
        } else {
            this.lvlProvider.setCurCode(lstComponentDto[lstComponentDto.length - 1].lvlCode);
        }
        component.getComponentDto().lvlCode = this.lvlProvider.getNext();
        this.addComponent(component);
        return component;
    }

    private selectTreeNode(comId) {
        if (!this.isMaskTreeChange) {
            this.isMaskTreeChange = true;
            this.compTree.selectNodeById(comId, true);
        }
        this.isMaskTreeChange = false;
    }

    private addComponent(component: Component): DesignComponent<any> {
        let newCom = new DesignComponent(component);
        this.templetQuery.addDetail(QrTempletDetailDto.fromCompDto(component.getComponentDto()));
        this.blockViewer.getLstComponent().push(component);
        return newCom;
    }


    private resortComponentByTree() {
        let comps = this.getTreeData();
        this.reshowDesignPanel(comps);
    }

    private deleteComp(comp: DesignComponent<any> | object) {
        this.compTree.getJsTree().delete_node(comp);
        this.resortComponentByTree();
    }

    private createComponentInfo(colDto: ColumnDto) {
        let comp = new Component();
        let col = new Column();
        col.setColumnDto(colDto);
        comp.setColumn(col);
        let compDto = new ComponentDto();
        compDto.dispType = this.getDisplayTypeByFieldType(colDto);
        compDto.title = colDto.title;
        compDto.columnId = colDto.columnId;
        compDto.componentId = CommonUtils.genId();
        compDto.titleSpan = 3;
        compDto.horSpan = 4;
        compDto.verSpan = 1;
        compDto.versionCode = this.blockViewer.getBlockViewDto().versionCode;
        compDto.blockViewId = this.blockViewer.getBlockViewDto().blockViewId;
        compDto.componentId = CommonUtils.genId();
        let qrTempletDetailDto = QrTempletDetailDto.fromCompDto(compDto);
        qrTempletDetailDto.templetDetailId = compDto.componentId;
        this.templetQuery.addDetail(qrTempletDetailDto);
        comp.setLayoutType(this.layoutType);
        comp.setComponentDto(compDto);
        return comp;
    }


    private getDisplayTypeByFieldType(colDto: ColumnDto) {
        if (colDto.refId) {
            return Constants.ComponentType.select;
        }
        let colType = colDto.fieldType;
        if (colType == Constants.FieldType.int || colType == Constants.FieldType.decimal) {
            return Constants.ComponentType.number;
        } else if (colType == Constants.FieldType.datetime) {
            return Constants.ComponentType.time;
        } else {
            return Constants.ComponentType.text;
        }
    }

    public getTreeData(lvlCode?: string): Array<Component> {
        let oraData = this.compTree.getJsTree().get_json(null, {flat: false});
        if (oraData && oraData.length > 0) {
            let lstComp = [];
            let provider = new CodeLevelProvider();
            let data = oraData[0].children;
            for (let row of data) {
                this.getTreeValue(provider, lstComp, row);
            }
            return lstComp;
        }
        return null;
    }

    private getTreeValue(codeLevelProvider: CodeLevelProvider, result, rowData) {
        let curCode = codeLevelProvider.getNext();
        let component = this.getComponentInfoById(rowData.data.componentId);
        component.getDtoInfo().getComponentDto().lvlCode = curCode;
        //这里需要恢复扩展信息,也就是到得一次信息后,需要刷新,设置面板才可以正常显示
        component.getDtoInfo().getComponentDto().horSpan = component.getHorSpan();
        component.getDtoInfo().getComponentDto().verSpan = component.getVerSpan();
        result.push(component.getDtoInfo());
        if (rowData.children) {
            codeLevelProvider.goSub();
            for (let subRow of rowData.children) {
                this.getTreeValue(codeLevelProvider, result, subRow);
            }
        }
        codeLevelProvider.setCurCode(curCode);
    }


    doSave() {
        if (!this.templetId) {
            Alert.showMessage('不需要保存');
            return;
        }
        TempletDesignService.saveDetail(this.templetId, this.getAllSaveData(), (result) => {
            if (result.success) {
                UiService.clearCache(this.blockViewer.getBlockViewDto().blockViewId);
                Alert.showMessage({message: '保存成功'});
                this.reload();

            } else {
                Alert.showMessage({message: '保存失败,原因:' + result.err, type: Alert.type.warning});
            }
        })
    }

    private getComponentInfoById(id): DesignComponent<Component> {
        for (let com of this.blockViewer.getLstComponent()) {
            if (com.getComponentDto().componentId == id) {
                return new DesignComponent(com);
            }
        }
        return null;
    }

    destroy(): boolean {
        EventBus.removeListener(EventBus.SELECT_CHANGE_EVENT, this);
        EventBus.removeListener(EventBus.DELETE_COLUMN, this);
        this.clear();
        this.selectListener = null;
        this.$compBody = null;
        EventBus.clearEvent();
        $(document).off('dnd_stop.vakata.jstree', this.dropHandler);
        return super.destroy();
    }

    showBlock() {
        this.ready = false;
        TempletDesignService.findTempQuery(this.templetId, (qrTempletQuery: QrTempletQuery) => {
            if (qrTempletQuery == null) {
                this.blockViewer = new BlockViewer();
            } else {
                this.blockViewer = qrTempletQuery.toBlockView();
            }
            this.templetQuery = qrTempletQuery;
            this.showComponent(true);
        })
    }

    private reshowDesignPanel(lstComp: Array<Component>) {
        this.blockViewer.setLstComponent(lstComp);
        this.isMaskTreeChange = true;
        this.showComponent(false);
        this.isMaskTreeChange = false;

    }

    private showComponent(clearTree: boolean) {
        this.clear(clearTree);
        if (this.blockViewer) {
            this.width = this.blockViewer.getBlockViewDto().colSpan;
            this.height = this.blockViewer.getBlockViewDto().rowSpan;
            this.showTable();
            if (clearTree) {
                this.compTree.setValue(this.blockViewer.getAllComponentDto());
            }

        }
        this.ready = true;
    }

    private initTempletQuery(blockViewer: BlockViewer) {
        this.templetQuery = new QrTempletQuery();
        let lstComp = blockViewer.getLstComponent();
        if (lstComp) {
            lstComp.forEach(component => {
                this.templetQuery.addDetail(QrTempletDetailDto.fromCompDto(component.getComponentDto()));
            })
        }
    }

    private showTable() {
        this.$element.find('.form-body').resizable({
            stop: (e) => {
                this.height = this.$element.find('.form-body').height();
                this.width = this.$element.find('.form-body').width();
                this.$element.setGridWidth(this.width);
            }
        });


        this.dTable = new DesignTable(this.blockViewer);
        this.dTable.addSelectChangeListener({
            handleEvent: (eventType: string, comID: any, value: any, extObject?: any) => {
                if (eventType === EventBus.SELECT_CHANGE_EVENT) {

                    if (this.selectListener) {
                        this.selectListener.handleEvent(EventBus.SELECT_CHANGE_EVENT,
                            this.blockViewer.findComponent(comID).getComponentDto(), value);
                    }
                    if (!this.isMaskTreeChange) {
                        this.isMaskPanelSelectChange = true;
                        this.selectTreeNode(comID);
                        this.isMaskPanelSelectChange = false;
                    }
                } else if (eventType === EventBus.VALUE_CHANGE_EVENT) {
                    this.blockViewer.findComponent(comID).getComponentDto().width = value;
                    this.templetQuery.findDetailById(comID).width = value;
                    this.manageCenter.attrChanged(this, this.getTableIds()[0],
                        ManagedUITools.getDsKeyValueByDtoRow(this.getTableIds()[0],
                            this.templetQuery.findDetailById(comID)), 'width', value);
                }
            }
        });

        this.$compBody.append(this.dTable.getViewUI());
        this.handleContainerSize();


    }


    private handleContainerSize() {
        let num = this.width;
        if (num > 12) {
            this.$element.find('.form-body').css('width', num);
        } else if (num > 0) {
            this.$element.find('.form-body').addClass('col-md-' + num);
            this.$element.find('.form-body').css('width', 'auto');
        } else {
            this.$element.find('.form-body').css('width', 'auto');
        }
        num = this.height;
        if (num > 12) {
            this.$element.find('.form-body').css('height', num);
        } else if (num > 0) {
            this.$element.find('.form-body').css('height', QrDesignPanel.rowHeight * num)

        } else {
            this.$element.find('.form-body').css('height', 'auto');
        }

        this.$element.setGridWidth(this.$element.find('.form-body').width());

    }


    private clear(clearTree = true) {
        this.currentDto = null;
        if (this.dTable) {
            this.dTable.destroy();
            this.dTable = null;
        }
        if (clearTree) {
            this.compTree.setValue(null);
        }
    }

    //-------------------------接口

    addEventInterceptor(operType: number | string, interceptor: EventInterceptor) {
    }

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
        if (!this.currentDto) {
            return;
        }
        if (field === 'title') {
            this.compTree.changeCurrentNodeText(value);
        }
        this.currentDto[field] = value;
        this.templetQuery.findDetailById(this.currentDto.componentId)[field] = value;
        this.dTable.propertyChanged(field, value);
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        Alert.showMessage(buttonInfo.title);
        return false;
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {

    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (this === source || !row) {
            return;
        }
        this.templetId = row['templet_id'];
        this.showBlock();
        this.manageCenter.dsSelectChanged(this, this.getTableIds()[0], null);

    }

    getPageDetail(): PageDetailDto {
        return null;
    }

    getTableIds(): Array<number> {
        return [SchemaFactory.getTableByTableName(QrConstants.TEMPLET_DETAIL_TABLE,
            QrConstants.QR_DEFAULT_SCHEMA).getTableDto().tableId];
    }

    getUiDataNum(): number {
        return 2;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    reload(): void {
        this.showBlock();
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        let btns = ManagedUITools.findRelationButtons(buttons, this.getTableIds()[0]);
        if (!btns || btns.length < 1) {
            return;
        }
        //只对保存和修改关心,增加和删除需要数据集控件(如表,树)的支持
        let relationBtn = new Array<MenuButtonDto>();
        let canHandleType = this.getCanHandleButtonType();
        for (let btn of btns) {
            if (canHandleType.indexOf(btn.tableOpertype) != -1) {
                btn.isUsed = true;
                relationBtn.push(btn);
            }
        }
        if (relationBtn.length < 1) {
            return;
        }
        this.addButton(this.toButtonInfo(relationBtn));
    }

    addButton(btnInfo: ButtonInfo | Array<ButtonInfo>) {
        if (btnInfo instanceof Array) {
            for (let btn of btnInfo) {
                this.toolbar.addButton(btn);
            }
        } else {
            this.toolbar.addButton(btnInfo);
        }
    }

    /**
     * 这里处理的是自己按钮的触发
     * @param event
     * @param menuBtnDto
     * @param data
     */
    protected componentButtonClicked(event: ClickEvent, menuBtnDto: MenuButtonDto, data) {
        //如果是取消
        if (menuBtnDto.tableOpertype === Constants.DsOperatorType.cancel) {
            this.doCancel();
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.saveSingle
            || menuBtnDto.tableOpertype === Constants.DsOperatorType.saveMulti) {
            this.doSave();
        } else if (menuBtnDto.tableOpertype === Constants.DsOperatorType.edit) {
            this.manageCenter.stateChange(this, this.getTableIds[0], Constants.TableState.edit);
        }
    }

    private doCancel() {
        if (!this.templetId) {
            Alert.showMessage('不需要取消');
            return;
        }
        Dialog.showConfirm('确定要取消所有的修改吗？', () => {
            this.reload();
            this.manageCenter.stateChange(this, this.getTableIds()[0], Constants.TableState.view);
            return true;
        });

        return false;
    }

    private getCanHandleButtonType() {
        return [Constants.DsOperatorType.edit,
            Constants.DsOperatorType.saveSingle,
            Constants.DsOperatorType.saveMulti,
            Constants.DsOperatorType.cancel];
    }

    setEditable(editable): void {
        super.setEditable(editable);
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    stateChange(source: any, tableId, state: number, extendData ?: any) {
        Alert.showMessage(tableId + state)
    }


}
