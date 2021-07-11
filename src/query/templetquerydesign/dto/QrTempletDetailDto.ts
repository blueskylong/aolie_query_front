import {ComponentDto} from 'aolie_core/src/uidesign/dto/ComponentDto';
import {BeanFactory} from 'aolie_core/src/decorator/decorator';
import {Component} from 'aolie_core/src/blockui/uiruntime/Component';
import {SchemaFactory} from 'aolie_core/src/datamodel/SchemaFactory';


export class QrTempletDetailDto {
    templetDetailId: number;
    templetId: number;
    columnId: number;
    extendType: number;
    xh: number;
    refId: number;
    levelShow: number;
    selectIds: string;
    lvlCode: string;
    title: string;
    orderType: number;
    dispType: number;
    width: number;
    format: string;
    groupType: number;

    private _other = 1;

    static fromCompDto(compDto: ComponentDto): QrTempletDetailDto {

        let templetDetailDto = BeanFactory.populateBean(QrTempletDetailDto, compDto);
        templetDetailDto.templetDetailId = compDto.componentId;
        return templetDetailDto;
    }

    /**
     * 转换成控件数据
     * @param tempDetailDto
     */
    static toComponent(tempDetailDto: QrTempletDetailDto): Component {
        let comp = new Component();
        let compDto = BeanFactory.populateBean(ComponentDto, tempDetailDto);
        compDto.componentId = tempDetailDto.templetDetailId;
        let column = SchemaFactory.getColumnById(compDto.columnId);
        comp.setColumn(column);
        comp.setComponentDto(compDto);
        return comp;
    }


    get other(): number {
        return this._other;
    }

    set other(value: number) {
        this._other = value;
    }
}
