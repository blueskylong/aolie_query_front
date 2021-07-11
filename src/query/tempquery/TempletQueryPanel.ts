import {PageDetailDto} from 'aolie_core/src/funcdesign/dto/PageDetailDto';
import {BaseAutoManagedUI} from 'aolie_core/src/blockui/managedView/BaseAutoManagedUI';
import {SchemaFactory} from 'aolie_core/src/datamodel/SchemaFactory';
import {QrConstants} from '../common/QrConstants';
import {ButtonInfo, Toolbar, ToolbarInfo} from 'aolie_core/src/uidesign/view/JQueryComponent';
import {ManagedUITools} from 'aolie_core/src/blockui/managedView/ManagedUITools';
import {MenuButtonDto} from 'aolie_core/src/sysfunc/menu/dto/MenuButtonDto';
import {Constants} from 'aolie_core/src/common/Constants';
import {TempletQueryService} from './services/TempletQueryService';
import {QueryResult} from './modal/QueryResult';
import {Form} from 'aolie_core/src/blockui/Form';
import {Table} from 'aolie_core/src/blockui/table/Table';
import {LocalRenderProvider} from 'aolie_core/src/blockui/table/TableRenderProvider';
import {CustomUi} from 'aolie_core/src/decorator/decorator';
import {UiUtils} from 'aolie_core/src/common/UiUtils';
import {Alert} from 'aolie_core/src/uidesign/view/JQueryComponent/Alert';

@CustomUi("TempletQueryPanel")
export class TempletQueryPanel extends BaseAutoManagedUI<PageDetailDto> {
    private tableId = -1;

    private toolbar: Toolbar<ToolbarInfo>;
    private formFilter: Form;
    private table: Table;

    private $corPanel: JQuery;
    private $title: JQuery;
    private $emptyHint: JQuery;
    private $showPanel: JQuery;

    private lastTempletId: number;
    private lastViewId: number;

    createUI(): HTMLElement {
        return $(require("./templates/TempQueryPanel.html")).get(0);
    }

    protected initSubControls() {
        this.tableId = SchemaFactory.getTableByTableName(QrConstants.TEMPLET_MAIN_TABLE,
            QrConstants.QR_DEFAULT_SCHEMA).getTableDto().tableId;
        this.initToolBar();
        this.$corPanel = this.$element.find(".panel-group");
        this.$title = this.$element.find(".title-a");
        this.$emptyHint = this.$element.find(".empty-hint");
        this.$showPanel = this.$element.find(".show-panel");
        this.fireReadyEvent();

    }

    getUiDataNum(): number {
        return 1;
    }

    getTableIds(): Array<number> {
        return [this.tableId];
    }

    protected componentButtonClicked(event: JQuery.ClickEvent<any, any, any, any>, menuBtnDto: MenuButtonDto, data) {
        if (menuBtnDto.tableOpertype == Constants.DsOperatorType.query) {
            if (!this.lastTempletId) {
                Alert.showMessage("请选择查询的模板");
                return;
            }
            this.doQuery(this.lastTempletId, this.lastViewId);
            return true;
        } else if (menuBtnDto.tableOpertype == Constants.DsOperatorType.export) {
            Alert.showMessage("暂时未实现--导出");
            return true;
        }
        return false;
    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return false;
    }

    setButtons(buttons: Array<MenuButtonDto>) {
        let btns = ManagedUITools.findRelationButtons(buttons, this.tableId);
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
        if (!this.toolbar) {
            this.initToolBar();
        }
        if (btnInfo instanceof Array) {
            for (let btn of btnInfo) {
                this.toolbar.addButton(btn);
            }
        } else {
            this.toolbar.addButton(btnInfo);
        }

    }

    protected initEvent() {
        this.$title.on("click", (event) => {
            this.$title.text(
                this.$title.attr("aria-expanded") == "true" ? "显示条件面板" : "隐藏条件面板");
            setTimeout(() => {
                $(window).trigger("resize");
            }, 300)

        });
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (source === this) {
            return;
        }
        if (this.tableId !== tableId) {
            return;
        }
        if (!mapKeyAndValue) {
            return;
        }
        this.doQuery(mapKeyAndValue["templet_id"], row["filter_view_id"]);

    }

    private doQuery(templetId: number, filterViewId: number) {
        UiUtils.showMask();
        //如果是再一次查询
        let isQueryAgain = false;
        let filter = {};
        if (this.lastTempletId === templetId) {
            isQueryAgain = true;
            filter = this.formFilter.getValue();
        }
        this.lastTempletId = templetId;
        TempletQueryService.findCustomQueryResult(templetId, filter, (result) => {
            this.refreshShow(result, isQueryAgain, filterViewId);
        });
    }


    private updateView(isShowTable: boolean) {
        if (isShowTable) {
            this.$emptyHint.css("display", "none");
            this.$showPanel.css("display", "block");
        } else {
            this.$emptyHint.css("display", "block");
            this.$showPanel.css("display", "none");
            if (this.table && !this.table.isDestroied()) {
                this.table.destroy();
            }
            if (this.formFilter && !this.formFilter.isDestroied()) {
                this.formFilter.destroy();
            }
        }
    }

    private refreshShow(result: QueryResult, onlyTable: boolean, viewId) {
        if (!result) {
            this.updateView(false);
            UiUtils.hideMask();
            return;
        }
        this.updateView(true);
        //更新查询
        if (!onlyTable) {
            if (this.formFilter && !this.formFilter.isDestroied()) {
                this.formFilter.destroy();
            }
            if (viewId) {
                this.formFilter = Form.getInstance(viewId);
                this.$element.find(".query-form").append(this.formFilter.getViewUI());
                this.$corPanel.css("display", "block");
            } else {
                this.formFilter = null;
                this.$corPanel.css("display", "none");
            }

        }
        //更新表格
        if (this.table && !this.table.isDestroied()) {
            this.table.destroy();
        }
        result.getViewer().setShowSearch(false);
        let localPro = new LocalRenderProvider(result.getViewer(), {
            rowNum: 10000,
            pgbuttons: false,
            pginput: false,
            rowList: 10000
        } as any);
        this.table = new Table(localPro);
        this.$element.find(".table-panel").append(this.table.getViewUI());
        this.table.addReadyListener(() => {
            let lstData = result.getLstData();
            if (lstData && lstData.length > 0) {
                this.table.setValue(lstData);
            }
            UiUtils.hideMask();

        });

    }

    /**
     * 取得可以处理的类型
     */
    protected getCanHandleButtonType() {
        return [Constants.DsOperatorType.query,
            Constants.DsOperatorType.export];
    }

    private initToolBar() {
        this.toolbar = new Toolbar<ToolbarInfo>({float: false});
        this.$element.find(".toolbar-panel").append(this.toolbar.getViewUI());
    }

}
