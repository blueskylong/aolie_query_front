import {QrCustomTempletDto} from './QrCustomTempletDto';
import {QrTempletDetailDto} from './QrTempletDetailDto';

import {main} from '@popperjs/core';
import {PopulateBean} from 'aolie_core/src/decorator/decorator';
import { BlockViewer } from 'aolie_core/src/blockui/uiruntime/BlockViewer';
import { Component } from 'aolie_core/src/blockui/uiruntime/Component';
import { BlockViewDto } from 'aolie_core/src/uidesign/dto/BlockViewDto';

/**
 * 查询定义包装对象
 */
export class QrTempletQuery {

    private mainDto: QrCustomTempletDto;


    private lstDetail: Array<QrTempletDetailDto> = [];

    @PopulateBean(QrTempletDetailDto)
    setLstDetail(value: Array<QrTempletDetailDto>) {
        this.lstDetail = value;
    }

    getLstDetail() {
        return this.lstDetail;
    }

    @PopulateBean(QrCustomTempletDto)
    setMainDto(mainDto: QrCustomTempletDto) {
        this.mainDto = mainDto;
    }

    getMainDto() {
        return this.mainDto;
    }

    /**
     *  转换成普通的视图定义
     */
    toBlockView(): BlockViewer {
        let blockView = new BlockViewer();
        // private blockViewDto: BlockViewDto;
        // private lstComponent: Array<Component>;
        let blockViewDto = new BlockViewDto();
        blockViewDto.blockViewId = 1;
        blockViewDto.blockViewName = this.mainDto.templetName;
        blockView.setBlockViewDto(blockViewDto);

        let lstComp = new Array<Component>();
        if (this.lstDetail) {
            this.lstDetail.forEach((detailDto => {
                lstComp.push(QrTempletDetailDto.toComponent(detailDto));
            }))
        }
        blockView.setLstComponent(lstComp);
        return blockView;
    }

    public findDetailById(id) {
        for (let dto of this.lstDetail) {
            if (dto.templetDetailId === id) {
                return dto;
            }
        }
        return null;
    }

    public addDetail(detailDto: QrTempletDetailDto) {
        this.lstDetail.push(detailDto);
    }

    public removeDetail(id) {
        for (let i = 0; i < this.lstDetail.length; i++) {
            let dto = this.lstDetail[i];
            if (dto.templetDetailId === id) {
                this.lstDetail.splice(i, 1);
                return;
            }
        }
    }


}
