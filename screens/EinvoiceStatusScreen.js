import React from 'react'
import {FlatList, TouchableOpacity, View} from 'react-native'
import {connect} from 'react-redux'
import ScreenHeader from "../components/ScreenHeader"
import {LocaleContext} from '../locales/LocaleContext'
import AddBtn from '../components/AddBtn'
import {getCurrentClient} from '../actions/client'
import LoadingScreen from "./LoadingScreen"
import styles from '../styles'
import {ThemeScrollView} from "../components/ThemeScrollView";
import {StyledText} from "../components/StyledText";
import {api, dispatchFetchRequest, dispatchFetchRequestWithOption} from '../constants/Backend'
import {BottomMainActionButton, MainActionButton} from "../components/ActionButtons"
import {NavigationEvents} from 'react-navigation'
import Icon from "react-native-vector-icons/Ionicons";
import {Field, reduxForm} from 'redux-form'
import InputText from '../components/InputText'
import {isRequired} from '../validators'

class EinvoiceStatusScreen extends React.Component {
    static navigationOptions = {
        header: null
    }
    static contextType = LocaleContext

    constructor(props, context) {
        super(props, context)
        this.state = {
            checkEInvoiceEligibility: false
        }

    }

    componentDidMount() {

        this.props.getCurrentClient()
        this.refreshScreen()

    }

    refreshScreen = () => {
        !!this.props?.client?.attributes?.UBN && this.getCurrentEinvoice(this.props?.client?.attributes?.UBN)
        this.checkEInvoiceEligibility()
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props?.client !== prevProps?.client) {
            this.refreshScreen()
        }
    }


    getCurrentEinvoice = (ubn) => {
        dispatchFetchRequestWithOption(api.eInvoice.getByUbn(ubn), {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        }, {
            defaultMessage: false
        }, response => {
            response.json().then(data => {
                this.setState({eInvoiceData: data})
            })
        }).then()
    }

    checkEInvoiceEligibility = () => {
        dispatchFetchRequestWithOption(api.eInvoice.checkEligibility, {
            method: 'GET',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
        }, {
            defaultMessage: false
        }, response => {
            response.json().then(data => {
                this.setState({checkEInvoiceEligibility: data?.eligible ?? false})
            })
        }).then()
    }

    handleAesKeySubmit = async (data) => {
        await dispatchFetchRequestWithOption(api.eInvoice.generateAESKey, {
            method: 'POST',
            withCredentials: true,
            credentials: 'include',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: data?.AES_KEY,
        }, {
            defaultMessage: false
        }, response => {
            response.json().then(data => {
            })
        }).then()
        this.props.getCurrentClient()
    }

    Item = (item) => {
        return (
            <View style={styles.rowFront}>
                <TouchableOpacity
                    onPress={() => {}}
                >
                    <StyledText style={styles.rowFrontText}>{item.rangeIdentifier}</StyledText>
                </TouchableOpacity>
            </View>
        );
    }

    render() {
        const {navigation, isLoading, client, handleSubmit} = this.props
        const {t} = this.context

        if (isLoading) {
            return (
                <LoadingScreen />
            )
        }
        return (
            <ThemeScrollView>
                <View style={[styles.fullWidthScreen]}>
                    <NavigationEvents
                        onWillFocus={() => {
                            this.refreshScreen()
                        }}
                    />
                    <ScreenHeader title={t('eInvoice.eInvoiceStatusTitle')}
                        parentFullScreen={true}

                    />
                    <View style={[styles.container, {justifyContent: 'space-around'}]}>
                        <View style={{marginBottom: 16}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8}}>
                                <View style={{flexDirection: 'row'}}>
                                    <StyledText style={styles.messageBlock}>
                                        {t('eInvoice.ubn')}
                                    </StyledText>
                                    <Icon
                                        name={!!this.props?.client?.attributes?.UBN ? 'md-checkmark-circle-outline' : 'md-close-circle-outline'}
                                        size={32}
                                        style={styles.buttonIconStyle}
                                    />
                                </View>
                                {!this.props?.client?.attributes?.UBN && <View style={{marginHorizontal: 10}}>
                                    <MainActionButton title={t('eInvoice.setUBN')} onPress={() => {
                                        this.props.navigation.navigate('Store')
                                    }} />
                                </View>}
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginVertical: 8}}>
                                <View style={{flexDirection: 'row'}}>
                                    <StyledText style={styles.messageBlock}>
                                        {t('eInvoice.AES_KEY')}
                                    </StyledText>
                                    <Icon
                                        name={!!this.props?.client?.attributes?.AES_KEY ? 'md-checkmark-circle-outline' : 'md-close-circle-outline'}
                                        size={32}
                                        style={[styles.buttonIconStyle]}
                                    />
                                </View>
                                {!this.props?.client?.attributes?.AES_KEY && <View style={{marginLeft: 10, flex: 1}}>
                                    <Field
                                        name={`AES_KEY`}
                                        component={InputText}
                                        validate={[isRequired]}
                                    />
                                </View>}
                                {!this.props?.client?.attributes?.AES_KEY && <View style={{marginHorizontal: 10}}>

                                    <MainActionButton title={t('eInvoice.setAES_KEY')} onPress={handleSubmit(data => {
                                        this.handleAesKeySubmit(data)
                                    })} />
                                </View>}
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8}}>
                                <View style={{flexDirection: 'row'}}>
                                    <StyledText style={styles.messageBlock}>
                                        {t('eInvoice.invoice')}
                                    </StyledText>
                                    <Icon
                                        name={!!this.state.checkEInvoiceEligibility ? 'md-checkmark-circle-outline' : 'md-close-circle-outline'}
                                        size={32}
                                        style={styles.buttonIconStyle}
                                    />
                                </View>
                                {!this.state.checkEInvoiceEligibility && !!this.props?.client?.attributes?.AES_KEY && !!this.props?.client?.attributes?.UBN && <View style={{marginHorizontal: 10}}>

                                    <MainActionButton title={t('eInvoice.setInvoice')} onPress={() => {
                                        this.props.navigation.navigate('EinvoiceEditScreen', {
                                            data: null,
                                            refreshScreen: () => {this.refreshScreen()},
                                        })
                                    }} />
                                </View>}
                            </View>
                        </View>
                        <View style={{flex: 1}}>
                            <StyledText style={{textAlign: 'center', fontSize: 20}}>{t('eInvoice.nowEinvoiceStatus')}</StyledText>
                        </View>
                        <View style={{flex: 9, justifyContent: 'space-around'}}>
                            <View style={{flexDirection: 'row'}}>
                                <StyledText style={{flex: 1, textAlign: 'left'}}>{t('eInvoice.rangeIdentifier')}</StyledText>
                                <StyledText style={{flex: 1, textAlign: 'right'}}>{this.state?.eInvoiceData?.rangeIdentifier}</StyledText>
                            </View>
                            <View style={{flexDirection: 'row'}}>
                                <StyledText style={{flex: 1, textAlign: 'left'}}>{t('eInvoice.rangeFrom')}</StyledText>
                                <StyledText style={{flex: 1, textAlign: 'right'}}>{this.state?.eInvoiceData?.numberRanges?.[0]?.prefix}{this.state?.eInvoiceData?.numberRanges?.[0]?.rangeFrom}</StyledText>
                            </View>
                            <View style={{flexDirection: 'row'}}>
                                <StyledText style={{flex: 1, textAlign: 'left'}}>{t('eInvoice.rangeTo')}</StyledText>
                                <StyledText style={{flex: 1, textAlign: 'right'}}>{this.state?.eInvoiceData?.numberRanges?.[0]?.prefix}{this.state?.eInvoiceData?.numberRanges?.[0]?.rangeTo}</StyledText>
                            </View>
                            <View style={{flexDirection: 'row'}}>
                                <StyledText style={{flex: 1, textAlign: 'left'}}>{t('eInvoice.remainingInvoiceNumbers')}</StyledText>
                                <StyledText style={{flex: 1, textAlign: 'right'}}>{this.state?.eInvoiceData?.numberRanges?.[0]?.remainingInvoiceNumbers}</StyledText>
                            </View>
                        </View>
                        <View style={{flex: 9, justifyContent: 'flex-end'}}>
                            <BottomMainActionButton title={t('eInvoice.viewAllInvoice')} onPress={() => {
                                this.props.navigation.navigate('EinvoiceSettingScreen')
                            }} />
                        </View>
                    </View>
                </View>
            </ThemeScrollView>
        )
    }
}

const mapStateToProps = state => ({
    isLoading: state.offers.loading,
    client: state.client.data,
    clientData: state.client
})

const mapDispatchToProps = dispatch => ({
    dispatch,
    getCurrentClient: () => dispatch(getCurrentClient())
})

EinvoiceStatusScreen = reduxForm({
    form: 'AES_KEYForm'
})(EinvoiceStatusScreen)

export default connect(mapStateToProps, mapDispatchToProps)(EinvoiceStatusScreen)
