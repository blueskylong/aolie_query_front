import BaseUI from "aolie_core/src/uidesign/view/BaseUI";
import {JsTree, JsTreeInfo} from "aolie_core/src/blockui/JsTree/JsTree";
import {SelectDsDlg} from "aolie_core/src/uidesign/dialog/SelectDsDlg";
import {DesignUiService} from "aolie_core/src/uidesign/service/DesignUiService";
import {AutoManagedUI, EventInterceptor, IManageCenter} from "aolie_core/src/blockui/managedView/AutoManagedUI";
import {MenuButtonDto} from "aolie_core/src/sysfunc/menu/dto/MenuButtonDto";
import {PageDetailDto} from "aolie_core/src/funcdesign/dto/PageDetailDto";
import {Constants} from "aolie_core/src/common/Constants";
import {CustomUi} from "aolie_core/src/decorator/decorator";
import {SchemaFactory} from "aolie_core/src/datamodel/SchemaFactory";
import {QrConstants} from "../common/QrConstants";

@CustomUi("SelectDsTree")
export class SelectDsTree extends BaseUI<any> implements AutoManagedUI {

    private dsTree: JsTree<JsTreeInfo>;
    private selectDsDlg: SelectDsDlg;
    private selectedTable: number;
    protected pageDetail: PageDetailDto;
    protected manageCenter: IManageCenter;

    private mainTableId = SchemaFactory.getTableByTableName(QrConstants.TEMPLET_MAIN_TABLE,
        QrConstants.QR_DEFAULT_SCHEMA).getTableDto().tableId;

    protected createUI(): HTMLElement {
        let $ele = $(require("./templates/SelectDsTree.html"));
        this.dsTree = new JsTree<any>({
            rootName: "数据表",
            multiSelect: false,
            textField: "name",
            idField: "id",
            parentField: "parent",
            showSearch: true,
            dnd: {
                isDraggable: true,
                onlyDroppable: true
            }
        });
        $ele.find(".ds-tree").append(this.dsTree.getViewUI());
        return $ele.get(0);
    }

    public afterComponentAssemble(): void {
        this.fireReadyEvent();
        super.afterComponentAssemble();
    }

    //--------------接口方法-------------------
    addEventInterceptor(operType: number | string, interceptor: EventInterceptor) {
    }

    attrChanged(source: any, tableId: number, mapKeyAndValue: object, field: string, value: any) {
        //如果表的DS选择变化了，则树也要变化
        if (field === "ds_id") {
            this.updateTree(value);
        }


    }

    btnClicked(source: any, buttonInfo: MenuButtonDto, data): boolean {
        return false;
    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {

    }

    private updateTree(tableId) {
        this.selectedTable = tableId;
        if (this.selectedTable) {
            DesignUiService.findTablesAndFields([this.selectedTable], (data) => {
                this.dsTree.setValue(data)
            })
        } else {
            this.dsTree.setValue(null);
        }
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (!row) {
            this.updateTree(null);
            return;
        }
        if (tableId === this.mainTableId) {
            //当选择的模板变化时触发
            this.updateTree(row["ds_id"]);
        }
    }

    getPageDetail(): PageDetailDto {
        return this.pageDetail;
    }

    getTableIds(): Array<number> {
        return [this.mainTableId];
    }

    getUiDataNum(): number {
        return 1;
    }

    referenceSelectChanged(source: any, refId, id, isLeaf) {
    }

    reload(): void {

    }

    setButtons(buttons: Array<MenuButtonDto>) {
    }

    setEditable(editable): void {
        if (editable) {
            this.$element.find(".btnSelectDs").removeAttr("disabled");
            this.dsTree.setDraggable(true);
        } else {
            this.$element.find(".btnSelectDs").attr("disabled", "true");
            this.dsTree.setDraggable(false);
        }
    }

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {
        this.setEditable(Constants.TableState.view != state);
    }


}
