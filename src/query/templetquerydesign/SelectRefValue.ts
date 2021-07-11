import {BaseComponent} from 'aolie_core/src/uidesign/view/BaseComponent';
import {PageDetailDto} from 'aolie_core/src/funcdesign/dto/PageDetailDto';
import {AutoManagedUI, IManageCenter} from 'aolie_core/src/blockui/managedView/AutoManagedUI';
import {MenuButtonDto} from 'aolie_core/src/sysfunc/menu/dto/MenuButtonDto';
import {Alert} from 'aolie_core/src/uidesign/view/JQueryComponent/Alert';
import {Form} from 'aolie_core/src/blockui/Form';
import {ReferenceTree, ReferenceTreeInfo} from 'aolie_core/src/blockui/JsTree/ReferenceTree';
import {CustomUi} from 'aolie_core/src/decorator/decorator';
import {SchemaFactory} from 'aolie_core/src/datamodel/SchemaFactory';
import {QrConstants} from '../common/QrConstants';
import {ManagedUITools} from 'aolie_core/src/blockui/managedView/ManagedUITools';
import {CommonUtils} from 'aolie_core/src/common/CommonUtils';
import {QrTempletDetailDto} from './dto/QrTempletDetailDto';

@CustomUi('SelectRefValue')
export class SelectRefValue extends BaseComponent<PageDetailDto> implements AutoManagedUI {
    private param: object;
    private form: Form;
    private tree: ReferenceTree<ReferenceTreeInfo>;
    private manageCenter: IManageCenter;
    private tableId = -1;
    //选择的ID
    private selectIds = '';
    //当前行键值
    private mapKeyAndValue: object;


    protected createUI(): HTMLElement {
        if (!this.properties.customParam) {
            Alert.showMessage('需要指定属性界面ID或编码');
            return this.getErrPanel('需要指定属性界面ID或编码');
        }
        try {
            this.param = JSON.parse(this.properties.customParam);
        } catch (e) {
            Alert.showMessage('配置的参数不正确:'
                + this.properties.customParam + ', 请检查是不是正确的JSON格式')
        }
        return $(require('./templates/SelectRefValue.html')).get(0);
    }

    protected initSubControls() {
        if (this.param['ui-code']) {
            this.form = Form.getInstanceByCode(this.param['ui-code'])
        } else {
            this.form = Form.getInstance(this.param['ui-id']);
        }

        this.$element.find('.attr-form').append(this.form.getViewUI());

        this.tree = new ReferenceTree<ReferenceTreeInfo>({refId: -1, isMulti: true});
        this.$element.find('.select-tree')
            .append(this.tree.getViewUI());
        this.tableId = SchemaFactory.getTableByTableName(QrConstants.TEMPLET_DETAIL_TABLE,
            QrConstants.QR_DEFAULT_SCHEMA).getTableDto().tableId;

    }


    protected initEvent() {
        this.form.addReadyListener(() => {
            this.fireReadyEvent();
        });
        this.form.addValueChangeListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                this.manageCenter.attrChanged(this, this.getTableIds()[0],
                    this.mapKeyAndValue, data, source);
            }
        });
        this.tree.addSelectListener({
            handleEvent: (eventType: string, data: any, source: any, extObject?: any) => {
                let ids = this.tree.getTree().getSelectedId(true);
                let sIds = '';
                if (ids && ids.length > 0) {
                    sIds = ids.join(';');
                }
                this.form.setFieldValue('selectIds', sIds);
                this.manageCenter.attrChanged(this, this.tableId,
                    this.mapKeyAndValue, 'selectIds', sIds);
            }
        });

    }

    dataChanged(source: any, tableId, mapKeyAndValue: object, changeType) {
    }

    dsSelectChanged(source: any, tableId, mapKeyAndValue, row?) {
        if (tableId != this.getTableIds()[0]) {
            return;
        }
        if (this.getTableIds()[0] == tableId) {
            this.form.setValue(row);
        }
        if (!row) {
            this.mapKeyAndValue = null;
            this.tree.changeRefId(-1);
            return;
        } else {
            this.mapKeyAndValue = ManagedUITools.getDsKeyValueByDtoRow(this.tableId, row);
        }
        let qrTempDetail = <QrTempletDetailDto>row;
        let column = SchemaFactory.getColumnById(qrTempDetail.columnId);
        if (column.getColumnDto().refId) {
            this.changeRefAndSetSelect(column.getColumnDto().refId, qrTempDetail.selectIds, qrTempDetail.levelShow)
        } else {
            this.tree.changeRefId(-1);
        }


    }

    private changeRefAndSetSelect(refId, selectValues: string, levelShow: number) {
        this.selectIds = selectValues;
        this.tree.changeRefId(refId, () => {
            if (selectValues) {
                this.tree.getTree().selectNodeById(selectValues.split(';'), true);
            }

        });

    }

    getPageDetail(): PageDetailDto {
        return this.properties;
    }

    getTableIds(): Array<number> {
        return [this.tableId];
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

    setManageCenter(manageCenter: IManageCenter) {
        this.manageCenter = manageCenter;
    }

    stateChange(source: any, tableId, state: number, extendData?: any) {

    }

    attrChanged(source: any, tableId, mapKeyAndValue, field, value) {
        if (source === this) {
            return;
        }
        //如果和源数据源有1对1的关系 ,则也需要刷新
        //这里简化,只处理本数据源且是同一行时更新自己
        if (this.isSameRow(tableId, mapKeyAndValue)) {
            this.form.setFieldValue(field, value);
        }
    }

    /**
     * 指定值是不是与当前同一行
     * @param tableId
     * @param mapKeyAndValue
     */
    protected isSameRow(tableId, mapKeyAndValue: object) {
        if (!mapKeyAndValue) {
            return false;
        }
        if (this.getTableIds().indexOf(tableId) == -1) {
            return false;
        }
        return CommonUtils.isEquals(mapKeyAndValue, this.mapKeyAndValue);

    }

    getValue(): any {
        return this.form.getValue();
    }

}
