import React from 'react'
import {connect} from 'react-redux'
import {Field, reduxForm} from 'redux-form'
import {Text, TouchableOpacity, View, ScrollView, Alert} from 'react-native'
import {formatCurrency, getfetchglobalOrderOffers, getOrder} from '../actions'
import RenderCheckBox from '../components/rn-elements/CheckBox'
import styles, {mainThemeColor} from '../styles'
import {LocaleContext} from '../locales/LocaleContext'
import ScreenHeader from "../components/ScreenHeader";
import CustomCheckBox from "../components/CustomCheckBox";
import {ThemeKeyboardAwareScrollView} from "../components/ThemeKeyboardAwareScrollView";
import {ThemeContainer} from "../components/ThemeContainer";
import {StyledText} from "../components/StyledText";

import {MoneyKeyboard, CardFourNumberKeyboard, CustomTitleAndDigitKeyboard, DiscountKeyboard} from '../components/MoneyKeyboard'
import Icon from 'react-native-vector-icons/FontAwesome';
import PaymentDiscountModal from './PaymentDiscountModal'
import {api, dispatchFetchRequestWithOption, successMessage} from '../constants/Backend'
import {isGuiNumberValid} from 'taiwan-id-validator2'
import {handleDelete} from "../helpers/orderActions";
import NavigationService from "../navigation/NavigationService";
import {NavigationEvents} from 'react-navigation'
import {ScanView} from '../components/scanView'
import InputText from '../components/InputText'
import {isRequired} from '../validators'

class PaymentFormScreenTablet extends React.Component {
    static navigationOptions = {
        header: null
    }
    static contextType = LocaleContext

    constructor(props, context) {
        super(props, context)


        this.state = {
            keyboardResult: 0,
            cardKeyboardResult: ['', '', '', ''],
            taxIDNumberKeyBoardResult: ['', '', '', '', '', '', '', ''],
            selectedPayLabel: 'CASH',
            selectedCardLabel: 'OTHER',
            haveTaxIDNumber: false,
            openTaxIDNumberKeyBoard: false,
            haveCarrierId: false,
            openScanView: false,
            openDiscountKeyBoard: false,
            modalVisible: false,
            modalData: props.order,
            orderLineItems: {},
            waiveServiceCharge: this.props.order?.serviceCharge === 0,
            carrierId: '123',
        }
    }

    componentDidMount() {
        this.props.getfetchglobalOrderOffers()
        this.props.getOrder(this.props.order.orderId)
        this.setState({waiveServiceCharge: this.props.order?.serviceCharge === 0})
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props?.order !== prevProps?.order) {
            this.setState({openDiscountKeyBoard: false, waiveServiceCharge: this.props.order?.serviceCharge === 0})
        }
    }

    refreshOrder = async () => {
        this.props.getfetchglobalOrderOffers()
        this.props.getOrder(this.props.order.orderId)
        this.setState({openDiscountKeyBoard: false})

    }

    initScreen = async () => {
        await this.props.getfetchglobalOrderOffers()
        await this.props.getOrder(this.props.order.orderId)
        this.setState({openDiscountKeyBoard: false, waiveServiceCharge: this.props.order?.serviceCharge === 0})
    }



    handleComplete = id => {
        const formData = new FormData()
        formData.append('action', 'COMPLETE')

        dispatchFetchRequestWithOption(api.order.process(id), {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {},
            body: formData
        }, {
            defaultMessage: false
        }, response => {
            if (!!this.props?.isSplitting) {
                if (this.props?.parentOrder?.lineItems.length !== 0) {
                    this.props.navigation.navigate('SpiltBillScreen', {
                        order: this.props?.parentOrder
                    })
                } else {
                    this.context?.saveSplitParentOrderId(null)
                    handleDelete(this.props?.parentOrder?.orderId, () => NavigationService.navigate('TablesSrc'))
                }

            } else {
                this.context?.saveSplitParentOrderId(null)
                this.props.navigation.navigate('TablesSrc')
            }
        }).then()
    }

    handleScanSuccess = (data) => {
        this.props?.change(`carrierId`, data)
        this.setState({openScanView: false})
    }

    handleSubmit = (values, autoComplete = false, cash = 0) => {
        const transactionObj = {
            orderId: this.props.order.orderId,
            paymentMethod: this.state.selectedPayLabel,
            billType: 'SINGLE',
            taxIdNumber: this.state.taxIDNumberKeyBoardResult.join(''),
            paymentDetails: {},
            printMark: true
        }
        if (!!values?.carrierId && this.state?.haveCarrierId) {
            transactionObj.carrierType = 'MOBILE'
            transactionObj.carrierId = values?.carrierId
        }
        if (this.state.selectedPayLabel === 'CASH') {
            transactionObj.paymentDetails['CASH'] = autoComplete ? cash : this.state.keyboardResult
        }
        if (this.state.selectedPayLabel === 'CARD') {
            transactionObj.paymentDetails['CARD_TYPE'] = this.state.selectedCardLabel
            transactionObj.paymentDetails['LAST_FOUR_DIGITS'] = this.state.cardKeyboardResult.join('')
        }


        if (this.state?.haveCarrierId && this.state?.haveTaxIDNumber) {
            Alert.alert(
                ``,
                `${this.context.t('payment.checkPrintInvoice')}`,
                [
                    {
                        text: `${this.context.t('action.yes')}`,
                        onPress: () => {
                            transactionObj.printMark = true
                            this.fetchApi(transactionObj)
                        }
                    },
                    {
                        text: `${this.context.t('action.no')}`,
                        onPress: () => {
                            transactionObj.printMark = false
                            this.fetchApi(transactionObj)
                        },
                        style: 'cancel'
                    }
                ]
            )
        } else {
            this.fetchApi(transactionObj)
        }
    }

    fetchApi = (transactionObj) => {
        console.log('transactionObj', transactionObj)
        dispatchFetchRequestWithOption(api.payment.charge, {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(transactionObj)
        }, {
            defaultMessage: false
        }, response => {
            successMessage(this.context.t('payment.charged'))

            response.json().then(data => {
                this.props.navigation.navigate('CheckoutComplete', {
                    transactionResponse: data,
                    onSubmit: this.handleComplete,
                    isSplitting: this.props?.isSplitting ?? false,
                    parentOrder: this.props?.parentOrder ?? null,
                })
            })
        }).then()
    }

    handleServiceChargePress = async (waiveServiceCharge) => {


        console.log('waiveServiceCharge', waiveServiceCharge)
        await dispatchFetchRequestWithOption(api.order.waiveServiceCharge(this.props.order.orderId, !waiveServiceCharge), {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
            }
        }, {
            defaultMessage: false
        }, response => {
        }).then()
        await this.refreshOrder()
        this.setState({waiveServiceCharge: !waiveServiceCharge})
    }



    render() {
        const {navigation, handleSubmit, globalorderoffers, order} = this.props
        const {t, themeStyle} = this.context
        console.log('globalorderoffers render2', this.props?.form)
        return (
            <ThemeContainer>
                <View style={[styles.fullWidthScreen]}>
                    <ScreenHeader backNavigation={true}
                        parentFullScreen={true}
                        title={t('payment.paymentTitle')}
                    />
                    <NavigationEvents
                        onWillFocus={async () => {
                            await this.initScreen()
                        }}
                    />
                    <PaymentDiscountModal
                        modalVisible={this.state.modalVisible}
                        submitOrder={(orderId) => {
                            this.setState({modalVisible: false});
                            this.props.navigation.navigate('OrderFormII', {
                                orderId: orderId
                            })
                        }}
                        closeModal={() => {this.setState({modalVisible: false}); getOrder(order.orderId)}}
                        handleSubmit={this.refreshOrder}
                        data={order}
                        globalorderoffers={globalorderoffers}
                        navigation={this.props.navigation}
                        prdId={this.state?.prdId}
                        isEditLineItem={this.state?.isEditLineItem ?? false} />
                    <View style={{flexDirection: 'row', flex: 1}}>
                        <View style={[styles.orderItemSideBar, themeStyle, {flex: 2, flexDirection: 'row', }]}>
                            {/* left list */}
                            <View style={{flex: 1}}>
                                <ScrollView style={{flex: 1}}>
                                    <View style={[styles.tableRowContainer, styles.tableCellView, styles.flex(1), themeStyle]}>
                                        <TouchableOpacity style={[(this.state.selectedPayLabel === 'CASH' ? styles.selectedLabel : null), {flex: 1}]} onPress={() => {this.setState({openDiscountKeyBoard: false, selectedPayLabel: 'CASH', openTaxIDNumberKeyBoard: false, cardKeyboardResult: ['', '', '', ''], selectedCardLabel: 'OTHER', })}}>
                                            <View style={styles.listPanel}>
                                                <StyledText style={styles.listPanelText}>{t('payment.cashPayment')}</StyledText>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.tableRowContainer, styles.tableCellView, styles.flex(1), themeStyle]}>
                                        <TouchableOpacity style={[(this.state.selectedPayLabel === 'CARD' ? styles.selectedLabel : null), {flex: 1}]} onPress={() => {this.setState({openDiscountKeyBoard: false, selectedPayLabel: 'CARD', keyboardResult: 0, openTaxIDNumberKeyBoard: false})}}>
                                            <View style={styles.listPanel}>
                                                <StyledText style={styles.listPanelText}>{t('payment.cardPayment')}</StyledText>
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.tableRowContainer, styles.tableCellView, styles.flex(1), themeStyle]}>
                                        <TouchableOpacity style={[(this.state.haveTaxIDNumber ? styles.selectedLabel : null), {flex: 1, flexDirection: 'row', alignItems: 'center'}]} onPress={() => {this.setState({openDiscountKeyBoard: false, haveTaxIDNumber: !this.state.haveTaxIDNumber, openTaxIDNumberKeyBoard: !this.state.haveTaxIDNumber})}}>
                                            <View style={styles.listPanel}>
                                                <StyledText style={styles.listPanelText}>{t('payment.taxIDNumber')}</StyledText>
                                            </View>
                                            {this.state.haveTaxIDNumber && <Icon style={{marginRight: 10}} name="times-circle" size={20} color='#f75336' />}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.tableRowContainer, styles.tableCellView, styles.flex(1), themeStyle]}>
                                        <TouchableOpacity style={[(this.state.haveCarrierId ? styles.selectedLabel : null), {flex: 1, flexDirection: 'row', alignItems: 'center'}]} onPress={() => {this.setState({openDiscountKeyBoard: false, haveCarrierId: !this.state.haveCarrierId, openScanView: false})}}>
                                            <View style={styles.listPanel}>
                                                <StyledText style={styles.listPanelText}>{t('payment.carrierId')}</StyledText>
                                            </View>
                                            {this.state.haveCarrierId && <Icon style={{marginRight: 10}} name="times-circle" size={20} color='#f75336' />}
                                        </TouchableOpacity>
                                    </View>
                                    <View style={[styles.tableRowContainer, styles.tableCellView, styles.flex(1), themeStyle]}>
                                        <TouchableOpacity style={[(this.state.waiveServiceCharge ? styles.selectedLabel : null), {flex: 1, flexDirection: 'row', alignItems: 'center'}]} onPress={() => {this.handleServiceChargePress(this.state.waiveServiceCharge)}}>
                                            <View style={styles.listPanel}>
                                                <StyledText style={styles.listPanelText}>{t('payment.waiveServiceCharge')}</StyledText>
                                            </View>
                                            {this.state.waiveServiceCharge && <Icon style={{marginRight: 10}} name="times-circle" size={20} color='#f75336' />}
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>
                            </View>
                            {/* mid content */}
                            <View style={{flex: 2}}>
                                <ThemeKeyboardAwareScrollView style={{flex: 1}}>
                                    <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                        <View style={[styles.tableCellView, {flex: 1}]}>
                                            <StyledText>{t('order.subtotal')}</StyledText>
                                        </View>

                                        <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                            <StyledText style={styles.tableCellText}>
                                                {formatCurrency(order.total.amountWithTax)}
                                            </StyledText>
                                        </View>
                                    </View>
                                    <TouchableOpacity onPress={() => {this.setState({openDiscountKeyBoard: !this.state.openDiscountKeyBoard, openTaxIDNumberKeyBoard: false})}} style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                        <View style={[styles.tableCellView, {flex: 1}]}>
                                            <StyledText>{t('order.discount')}</StyledText>
                                            <Icon style={{marginLeft: 10}} name="edit" size={20} color={mainThemeColor} />
                                        </View>

                                        <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                            <StyledText style={styles.tableCellText}>
                                                {formatCurrency(order.discount)}
                                            </StyledText>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                        <View style={[styles.tableCellView, {flex: 1}]}>
                                            <StyledText>{t('order.serviceCharge')}</StyledText>

                                        </View>

                                        <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                            <StyledText style={styles.tableCellText}>
                                                {formatCurrency(order.serviceCharge)}
                                            </StyledText>
                                        </View>
                                    </View>

                                    <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                        <View style={[styles.tableCellView, {flex: 1}]}>
                                            <StyledText>{t('order.total')}</StyledText>
                                        </View>

                                        <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                            <StyledText style={styles.tableCellText}>
                                                {formatCurrency(order.orderTotal)}
                                            </StyledText>
                                        </View>
                                    </View>
                                    {this.state.selectedPayLabel === 'CASH' && <View>
                                        <TouchableOpacity onPress={() => {this.setState({openDiscountKeyBoard: false, selectedPayLabel: 'CASH', openTaxIDNumberKeyBoard: false, cardKeyboardResult: ['', '', '', ''], selectedCardLabel: 'OTHER', })}} style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.paid')}</StyledText>
                                                <Icon style={{marginLeft: 10}} name="edit" size={20} color={mainThemeColor} />
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                <StyledText style={styles.tableCellText}>
                                                    {formatCurrency(this.state.keyboardResult)}
                                                </StyledText>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.remainder')}</StyledText>
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                <StyledText style={styles.tableCellText}>
                                                    {formatCurrency((order.orderTotal - this.state.keyboardResult) <= 0 ? 0 : (order.orderTotal - this.state.keyboardResult))}
                                                </StyledText>
                                            </View>
                                        </View>

                                        <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.change')}</StyledText>
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                <StyledText style={styles.tableCellText}>
                                                    {formatCurrency((order.orderTotal - this.state.keyboardResult) <= 0 ? (this.state.keyboardResult - order.orderTotal) : 0)}
                                                </StyledText>
                                            </View>
                                        </View>
                                    </View>}
                                    {this.state.selectedPayLabel === 'CARD' && <View>
                                        <TouchableOpacity onPress={() => {this.setState({openDiscountKeyBoard: false, selectedPayLabel: 'CARD', keyboardResult: 0, openTaxIDNumberKeyBoard: false})}} style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.CardNo')}</StyledText>
                                                <Icon style={{marginLeft: 10}} name="edit" size={20} color={mainThemeColor} />
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                <View style={[themeStyle, styles.cardDigitBox]}>
                                                    <StyledText style={{fontWeight: 'bold', }}>
                                                        {this.state.cardKeyboardResult[0]}
                                                    </StyledText>
                                                </View>
                                                <View style={[themeStyle, styles.cardDigitBox]}>
                                                    <StyledText style={{fontWeight: 'bold', }}>
                                                        {this.state.cardKeyboardResult[1]}
                                                    </StyledText>
                                                </View>
                                                <View style={[themeStyle, styles.cardDigitBox]}>
                                                    <StyledText style={{fontWeight: 'bold', }}>
                                                        {this.state.cardKeyboardResult[2]}
                                                    </StyledText>
                                                </View>
                                                <View style={[themeStyle, styles.cardDigitBox]}>
                                                    <StyledText style={{fontWeight: 'bold', }}>
                                                        {this.state.cardKeyboardResult[3]}
                                                    </StyledText>
                                                </View>
                                            </View>
                                        </TouchableOpacity>

                                        <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.cardType')}</StyledText>
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 2, justifyContent: 'flex-end', }]}>
                                                <TouchableOpacity onPress={() => this.setState({selectedCardLabel: 'OTHER'})} style={styles.cardLabel(this.state.selectedCardLabel === 'OTHER')}>
                                                    <Icon name="credit-card" size='25%' color={mainThemeColor} />
                                                    <StyledText>Other</StyledText>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => this.setState({selectedCardLabel: 'VISA'})} style={styles.cardLabel(this.state.selectedCardLabel === 'VISA')}>
                                                    <Icon name="cc-visa" size='25%' color={mainThemeColor} />
                                                    <StyledText>Visa</StyledText>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => this.setState({selectedCardLabel: 'MASTER'})} style={styles.cardLabel(this.state.selectedCardLabel === 'MASTER')}>
                                                    <Icon name="cc-mastercard" size='25%' color={mainThemeColor} />
                                                    <StyledText>MasterCard</StyledText>
                                                </TouchableOpacity>



                                            </View>
                                        </View>


                                    </View>}
                                    {this.state.haveTaxIDNumber && <View>
                                        <TouchableOpacity onPress={() => {this.setState({openTaxIDNumberKeyBoard: true})}} style={[styles.tableRowContainerWithBorder, styles.verticalPadding, {flexDirection: 'column'}]}>
                                            <View style={{flexDirection: 'row'}}>
                                                <View style={[styles.tableCellView, {flex: 1}]}>
                                                    <StyledText>{t('payment.taxIDNumber')}</StyledText>
                                                    <Icon style={{marginLeft: 10}} name="edit" size={20} color={mainThemeColor} />
                                                </View>

                                                <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[0]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[1]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[2]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[3]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[4]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[5]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[6]}
                                                        </StyledText>
                                                    </View>
                                                    <View style={[themeStyle, styles.cardDigitBox]}>
                                                        <StyledText style={{fontWeight: 'bold', }}>
                                                            {this.state.taxIDNumberKeyBoardResult[7]}
                                                        </StyledText>
                                                    </View>
                                                </View>
                                            </View>
                                            {isGuiNumberValid(this.state.taxIDNumberKeyBoardResult.join('')) ||
                                                <View style={{alignItems: 'flex-end', marginBottom: -18, marginTop: 2}}>
                                                    <StyledText style={{color: '#f75336'}}>{t('payment.checkTaxIDNumber')}</StyledText>
                                                </View>}
                                        </TouchableOpacity>
                                    </View>}
                                    {this.state.haveCarrierId &&
                                        <View style={[styles.tableRowContainerWithBorder, styles.verticalPadding]}>
                                            <View style={[styles.tableCellView, {flex: 1}]}>
                                                <StyledText>{t('payment.carrierId')}</StyledText>
                                            </View>

                                            <View style={[styles.tableCellView, {flex: 1, justifyContent: 'flex-end'}]}>
                                                <Field
                                                    name={`carrierId`}
                                                    component={InputText}
                                                    validate={[isRequired]}
                                                />
                                                <TouchableOpacity style={{minWidth: 64, alignItems: 'center', }}
                                                    onPress={() => {
                                                        this.setState({
                                                            openScanView: !this.state.openScanView
                                                        })
                                                    }}
                                                >
                                                    <Icon style={{marginLeft: 10}} name="camera" size={24} color={mainThemeColor} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    }
                                </ThemeKeyboardAwareScrollView>
                            </View>
                        </View>
                        {/* keyboard */}
                        <View style={{flex: 1}}>
                            {!this.state.openScanView && <View style={{flex: 7}}>
                                {this.state.openTaxIDNumberKeyBoard || this.state.openDiscountKeyBoard || <View style={{flex: 7}}>
                                    {this.state.selectedPayLabel === 'CASH' ? <MoneyKeyboard
                                        initialValue={0}
                                        value={this.state.keyboardResult}
                                        getResult={(result) => {this.setState({keyboardResult: result})}} />
                                        : <CardFourNumberKeyboard
                                            initialValue={['0', '1', '2', '3']}
                                            value={this.state.cardKeyboardResult}
                                            getResult={(result) => {this.setState({cardKeyboardResult: result})}} />}
                                </View>}
                                {this.state.openTaxIDNumberKeyBoard && <View style={{flex: 7}}>
                                    <CustomTitleAndDigitKeyboard
                                        title={t('payment.enterTaxIDNumber')}
                                        digit={8}
                                        value={this.state.taxIDNumberKeyBoardResult}
                                        getResult={(result) => {this.setState({taxIDNumberKeyBoardResult: result})}} />
                                </View>}
                                {this.state.openDiscountKeyBoard && <View style={{flex: 7}}>
                                    <DiscountKeyboard
                                        globalorderoffers={globalorderoffers}
                                        title={t('payment.discountOptions')}
                                        okPress={this.refreshOrder}
                                        order={order}
                                    />
                                </View>}
                            </View>}
                            {this.state.openScanView && <View style={{flex: 7}}>
                                <ScanView successCallback={(data) => {this.handleScanSuccess(data)}} />
                            </View>}
                            <View style={{flex: 1, flexDirection: 'row', padding: '3%'}}>
                                <View style={{flex: 1, marginHorizontal: 5}}>
                                    <TouchableOpacity
                                        onPress={() => this.props.navigation.goBack()}
                                        style={styles.flexButtonSecondAction}
                                    >
                                        <Text style={styles.flexButtonSecondActionText}>{t('payment.cancel')}</Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={{flex: 1, marginHorizontal: 5}}>
                                    <TouchableOpacity
                                        onPress={handleSubmit(data => {
                                            if (this.state.haveTaxIDNumber && !isGuiNumberValid(this.state.taxIDNumberKeyBoardResult.join(''))) {
                                                Alert.alert(
                                                    `${t('payment.checkTaxIDNumber')}`,
                                                    ` `,
                                                    [
                                                        {text: `${t('action.yes')}`, onPress: () => console.log("OK Pressed")}
                                                    ]
                                                )
                                            }
                                            else {
                                                if (this.state.selectedPayLabel === 'CASH' && (order.orderTotal - this.state.keyboardResult) > 0) {
                                                    Alert.alert(
                                                        `${t('payment.checkAutoComplete')}`,
                                                        ` `,
                                                        [
                                                            {text: `${t('action.yes')}`, onPress: () => this.handleSubmit(data, true, order.orderTotal)},
                                                            {
                                                                text: `${t('action.no')}`,
                                                                onPress: () => console.log('Cancelled'),
                                                                style: 'cancel'
                                                            }
                                                        ]
                                                    )
                                                }
                                                else
                                                    this.handleSubmit(data, false)
                                            }
                                        })}
                                        style={styles.flexButton}
                                    >
                                        <Text style={styles.flexButtonText}>
                                            {t('payment.ok')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>
            </ThemeContainer >
        )
    }
}

const mapStateToProps = (state, props) => ({
    globalorderoffers: state.globalorderoffers.data.results,
    order: state.order.data,
})

const mapDispatchToProps = (dispatch, props) => ({
    getOrder: () => dispatch(getOrder(props.order.orderId)),
    getfetchglobalOrderOffers: () => dispatch(getfetchglobalOrderOffers())
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(
    reduxForm({
        form: 'paymentFormTablet',
        enableReinitialize: true
    })(PaymentFormScreenTablet)
)
