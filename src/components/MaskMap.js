import React, { useEffect, useState, useCallback } from "react";
import { Alert, Container, Row, Col, Spinner, Button, Card } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faExclamationTriangle,
    faLocationArrow
} from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import useNaverMapsMarkers from "../hooks/useNaverMapsMarkers";
import { useTranslation } from "react-i18next";
import { useMaskData } from "../context/MaskDataContext";
import MapPanel from "./MapPanel";
import RemainingStockBadge from "./RemainingStockBadge";
import MaskStoreTable2 from "./MaskStoreTable2";

function MaskMap() {
    const { t, i18n } = useTranslation();

    useEffect(() => {
        i18n.changeLanguage("ko");
    }, []);

    const {
        mapObj,
        maskStores,
        setMaskStores,
        centerCoord,
        setCenterCoord
    } = useMaskData();
    const {
        addMarker,
        addColorIndicatorMarkers,
        resetMarker
    } = useNaverMapsMarkers();

    const [isLoading, setIsLoading] = useState(false);
    const [dataError, setDataError] = useState(false);
    const [showBetaAlert, setShowBetaAlert] = useState(true);

    const [markerFilter, setMarkerFilter] = useState({
        plenty: true,
        some: true,
        few: true,
        empty: false
    });

    const [nowDate, setNowDate] = useState('');

    const setNewMaskStores = useCallback(
        (data) => {
            const priority = [
                "plenty",
                "some",
                "few",
                "empty",
                "break",
                null,
                undefined
            ];
            data.sort(
                (a, b) =>
                    priority.indexOf(a.remain_stat) -
                    priority.indexOf(b.remain_stat)
            );
            setMaskStores(data);
        },
        [setMaskStores]
    );

    const markerFilterCheckboxHandler = (e) => {
        let target = e.target;
        console.log(target);
        setMarkerFilter((prev) => {
            return {
                ...prev,
                [target.name]: target.checked
            };
        });
    };

    useEffect(() => {
        console.log(markerFilter);
    }, [markerFilter]);

    const checkInStock = (remainStat) => {
        switch (remainStat) {
            case "plenty":
                return true;
            case "some":
                return true;
            case "few":
                return true;
            case "empty":
                return false;
            case "break":
                return false;
            default:
                return false;
        }
    };

    useEffect(() => {
        const fetchStoresByGeo = async (loc, range) => {
            const serverUrl = `https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/storesByGeo/json?lat=${loc.lat}&lng=${loc.lng}&m=${range}`;

            let result;
            try {
                setIsLoading(true);
                result = await axios(serverUrl);
                setIsLoading(false);
            } catch (error) {
                console.error("An error occurred in fetchStoresByGeo:", error);
                setDataError(true);
                setIsLoading(false);
                throw Error("Failed");
            }
            return result.data.stores;
        };

        const fn = async () => {
            resetMarker();
            console.log("Fetching store data...");
            let data;
            try {
                data = await fetchStoresByGeo(centerCoord, 5000);
                console.log(`New store data fetched`);
                console.log(data);
                resetMarker();
                setNewMaskStores(data);
            } catch {
                console.error("Failed to fetch data");
            }
        };

        fn();
    }, [centerCoord, setNewMaskStores]);

    useEffect(() => {
        if (mapObj) {
            mapObj.setCenter(centerCoord);
            mapObj.setZoom(14);
        }
    }, [mapObj, centerCoord]);

    useEffect(() => {
        if (!mapObj) {
            return;
        }

        addColorIndicatorMarkers(mapObj, maskStores);
    }, [maskStores]);


    useEffect(() => {
        // maskDate();
        setTimeout(() => maskDate(), 1000);
    }, [])

    const onClickMapRelocate = () => {
        const newCenter = mapObj.getCenter();
        setCenterCoord({
            lat: newCenter.y,
            lng: newCenter.x
        });
    };

    const maskDate = () => {
        const today = new Date();
        const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
        const day = dayNames[today.getDay()];
        const year = today.getFullYear();
        let month = today.getMonth() + 1;
        let date = today.getDate();

        month = month < 10 ? '0' + month : month;
        date = date < 10 ? '0' + date : date;
        
        const nowDay = `${year}년 ${month}월 ${date}일 ${day}요일`;
        if (day === '월') {
            setNowDate(`${nowDay}은 출생연도 끝자리 1, 6만 구매하실 수 있습니다.`);
        } else if (day === '화') {
            setNowDate(`${nowDay}은 출생연도 끝자리 2, 7만 구매하실 수 있습니다.`);
        } else if (day === '수') {
            setNowDate(`${nowDay}은 출생연도 끝자리 3, 8만 구매하실 수 있습니다.`);
        } else if (day === '목') {
            setNowDate(`${nowDay}는 출생연도 끝자리 4, 9만 구매하실 수 있습니다.`);
        } else if (day === '금') {
            setNowDate(`${nowDay}는 출생연도 끝자리 5, 0만 구매하실 수 있습니다.`);
        } else {
            setNowDate(`${nowDay}는 평일에 구매하지 못하신 분들이 구매하실 수 있습니다.`);
        }
    }

    return (
        <>
            <main>
                <Container id="mainContainer">
                    <Row>
                        <Col sm={12}>
                            {showBetaAlert && (
                                <Alert
                                    variant="warning"
                                    onClose={() => setShowBetaAlert(false)}
                                    dismissible>
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                    />{" "}
                                    {t("notice.apiIsInBeta")}
                                </Alert>
                            )}
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6}>
                            <Card style={{ marginBottom: '5px' }}>
                                <Card.Body>{nowDate}</Card.Body>
                            </Card>
                            <MapPanel />
                            <Button
                                variant="outline-primary"
                                className="mt-1 mb-1"
                                block
                                onClick={onClickMapRelocate}>
                                <FontAwesomeIcon icon={faLocationArrow} />{" "}
                                {t("refreshMapStores")}
                            </Button>
                        </Col>
                        <Col md={6}>
                            {dataError && (
                                <Alert variant="danger" className="mt-1">
                                    <FontAwesomeIcon
                                        icon={faExclamationTriangle}
                                    />{" "}
                                    {t("error.failedToLoadData")}
                                </Alert>
                            )}
                            <div className="border p-1 mb-1 d-flex flex-row justify-content-between">
                                <div class="form-check">
                                    <input
                                        type="checkbox"
                                        disabled
                                        class="form-check-input"
                                        id="showPlentyStores"
                                        name="plenty"
                                        defaultChecked={markerFilter.plenty}
                                        value={markerFilter.plenty}
                                        onChange={markerFilterCheckboxHandler}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="showPlentyStores">
                                        <RemainingStockBadge remainingStockStr="plenty" />{" "}
                                        100개 +
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input
                                        type="checkbox"
                                        disabled
                                        class="form-check-input"
                                        id="showSomeStores"
                                        name="some"
                                        defaultChecked={markerFilter.some}
                                        value={markerFilter.some}
                                        onChange={markerFilterCheckboxHandler}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="showSomeStores">
                                        <RemainingStockBadge remainingStockStr="some" />{" "}
                                        30-100
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input
                                        type="checkbox"
                                        disabled
                                        class="form-check-input"
                                        id="showFewStores"
                                        name="few"
                                        defaultChecked={markerFilter.few}
                                        value={markerFilter.few}
                                        onChange={markerFilterCheckboxHandler}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="showFewStores">
                                        <RemainingStockBadge remainingStockStr="few" />{" "}
                                        2-30
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input
                                        type="checkbox"
                                        disabled
                                        class="form-check-input"
                                        id="showEmptyStores"
                                        name="empty"
                                        defaultChecked={markerFilter.empty}
                                        value={markerFilter.empty}
                                        onChange={markerFilterCheckboxHandler}
                                    />
                                    <label
                                        class="form-check-label"
                                        for="showEmptyStores">
                                        <RemainingStockBadge remainingStockStr="empty" />{" "}
                                        0개
                                    </label>
                                </div>
                            </div>

                            {isLoading ? (
                                <Spinner animation="border" role="status">
                                    <span className="sr-only">Loading...</span>
                                </Spinner>
                            ) : maskStores && maskStores.length ? (
                                <>
                                    <MaskStoreTable2
                                        style={{
                                            overflow: "auto",
                                            maxHeight: "100px"
                                        }}
                                    />
                                </>
                            ) : (
                                <Alert variant="danger">
                                    주변에 마스크 판매처가 없습니다. 지도를
                                    이동한 후 지도 아래의 재검색 버튼을 이용해
                                    주세요.
                                </Alert>
                            )}
                        </Col>
                    </Row>
                </Container>
            </main>
        </>
    );
}

export default MaskMap;
