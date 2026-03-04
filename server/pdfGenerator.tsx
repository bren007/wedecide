import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, renderToBuffer } from '@react-pdf/renderer';

// Constants
const Colors = {
    Navy: '#0f172a',
    Charcoal: '#334155',
    White: '#ffffff',
    Red: '#dc2626',
    Amber: '#d97706',
    Green: '#16a34a',
    Grey: '#64748b',
    LightGrey: '#f1f5f9'
};

const styles = StyleSheet.create({
    page: {
        backgroundColor: Colors.White,
        padding: 50,
        fontFamily: 'Helvetica',
        color: Colors.Navy,
        position: 'relative',
        paddingBottom: 80 // Leave space for footer
    },
    coverPage: {
        backgroundColor: Colors.Navy,
        padding: 60,
        fontFamily: 'Helvetica',
        color: Colors.White,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
    },
    coverTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    coverOrg: {
        fontSize: 16,
        color: Colors.LightGrey,
        marginBottom: 80,
    },
    coverLogo: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginTop: 'auto',
    },
    coverDate: {
        fontSize: 12,
        color: Colors.LightGrey,
        marginTop: 10,
    },
    header: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.Navy,
        paddingBottom: 5,
        marginTop: 20
    },
    subHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 5,
    },
    bodyText: {
        fontSize: 11,
        lineHeight: 1.5,
        color: Colors.Charcoal,
        marginBottom: 10,
    },
    boldText: {
        fontWeight: 'bold',
        color: Colors.Navy,
    },
    footerContainer: {
        position: 'absolute',
        bottom: 30,
        left: 50,
        right: 50,
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.LightGrey,
        paddingTop: 10,
    },
    footerText: {
        fontSize: 9,
        color: Colors.Grey,
    },
    chartContainer: {
        marginTop: 20,
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'column',
    },
    chartBarWrapper: {
        flexDirection: 'row',
        marginBottom: 5,
        alignItems: 'center',
    },
    chartLabel: {
        width: 150,
        fontSize: 9,
        color: Colors.Navy,
        paddingRight: 10,
    },
    chartBarContainer: {
        flex: 1,
        height: 15,
        backgroundColor: Colors.LightGrey,
        position: 'relative',
    },
    chartBarFill: {
        height: '100%',
    },
    chartValue: {
        fontSize: 9,
        marginLeft: 10,
        width: 30,
        fontWeight: 'bold',
    },
    baselineMarker: {
        position: 'absolute',
        top: -5,
        bottom: -5,
        width: 2,
        backgroundColor: Colors.Navy,
        zIndex: 10,
    },
    baselineText: {
        position: 'absolute',
        top: -15,
        fontSize: 8,
        fontWeight: 'bold',
        color: Colors.Navy,
    },
    optionsList: {
        marginLeft: 15,
        marginTop: 10,
    },
    optionItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    optionBullet: {
        width: 15,
        fontSize: 11,
        fontWeight: 'bold',
    },
    optionText: {
        fontSize: 11,
        lineHeight: 1.5,
        flex: 1,
        color: Colors.Charcoal,
    }
});

interface ReportData {
    organizationName: string;
    dateStr: string;
    baselineSlots: number;
    totalLoad: number;
    fiscalDrag: number;
    initiatives: Array<{ name: string; cost: number; id: string | number; priority: string }>;
    analysis: {
        section3: string;
        section4: string;
        recoveredSlots: number;
    };
}

const Footer = ({ orgName, date }: { orgName: string; date: string }) => (
    <View style={styles.footerContainer} fixed>
        <Text style={styles.footerText}>{orgName} — Strategic Capacity Assessment</Text>
        <Text style={styles.footerText}>{date}</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => (`Page ${pageNumber}`)} />
    </View>
);

const AuditDocument = ({ data }: { data: ReportData }) => {
    const { organizationName, dateStr, baselineSlots, totalLoad, fiscalDrag, initiatives, analysis } = data;
    const utilizationPct = Math.round((totalLoad / baselineSlots) * 100);
    const inDeficit = totalLoad > baselineSlots;

    // Formatting currency
    const formattedFiscalDrag = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(fiscalDrag);

    // Visualisation Logic: Green (0-70%), Amber (71-100%), Red (>100%)
    let statusColor = Colors.Red;
    if (utilizationPct <= 70) statusColor = Colors.Green;
    else if (utilizationPct <= 100) statusColor = Colors.Amber;

    // Mapping priorities to weights for sorting
    const getPriorityWeight = (p: string) => {
        const lowerFormat = (p || '').toLowerCase();
        if (lowerFormat.includes('ministerial')) return 4;
        if (lowerFormat.includes('high')) return 3;
        if (lowerFormat.includes('medium')) return 2;
        if (lowerFormat.includes('low')) return 1;
        return 0; // Standard
    };

    // Sort initiatives: Ministerial/High (bottom/start) to Low (top/end)
    const sortedInitiatives = [...initiatives].sort((a, b) => {
        const weightA = getPriorityWeight(a.priority);
        const weightB = getPriorityWeight(b.priority);
        if (weightA !== weightB) return weightB - weightA;
        return b.cost - a.cost;
    });

    // maxBarValue for general scaling
    const maxBarValue = Math.max(baselineSlots, totalLoad, ...initiatives.map(i => i.cost)) * 1.1;

    // Helper for rendering line breaks properly
    const renderParagraphs = (text: string) => {
        if (!text) return null;
        return text.split('\n').filter(Boolean).map((para, i) => (
            <Text key={i} style={styles.bodyText}>{para.trim()}</Text>
        ));
    };

    return (
        <Document>
            {/* Cover Page */}
            <Page size="A4" style={styles.coverPage}>
                <View>
                    <Text style={styles.coverOrg}>{organizationName}</Text>
                    <Text style={styles.coverTitle}>Strategic Capacity Assessment</Text>
                    <Text style={styles.coverDate}>{dateStr}</Text>
                </View>
                <View style={{ marginTop: 'auto' }}>
                    <Text style={styles.coverLogo}>ALTURAGOV</Text>
                </View>
            </Page>

            {/* Executive Summary */}
            <Page size="A4" style={styles.page}>
                <Text style={styles.header}>Executive Summary</Text>

                <Text style={[styles.subHeader, { fontSize: 20 }]}>Operating at {utilizationPct}% of Capacity</Text>

                <Text style={styles.subHeader}>Current Load: {totalLoad} Slots against a Baseline of {baselineSlots} Slots.</Text>

                <Text style={[styles.bodyText, { marginTop: 10 }]}>
                    <Text style={styles.boldText}>Fiscal Note: </Text> Fiscal Drag identified: {formattedFiscalDrag} currently allocated to non-strategic initiatives.
                </Text>

                <Text style={styles.subHeader}>Structural Diagnosis</Text>
                <Text style={styles.bodyText}>
                    {inDeficit
                        ? 'Primary risk is structural delivery failure of Ministerial priorities due to volume.'
                        : 'Primary risk is inefficient allocation of resources to low-complexity/low-value activity.'}
                </Text>

                <Text style={styles.subHeader}>Overview of Findings</Text>
                <Text style={styles.bodyText}>
                    Our analysis of the {organizationName} portfolio demonstrates a capacity baseline of {baselineSlots} slots.
                    However, your current portfolio demands {totalLoad} slots.
                    {inDeficit
                        ? ` This results in an overcommitment of ${totalLoad - baselineSlots} slots. This over-saturation creates a bottleneck that endangers high-priority initiatives, drastically increasing the likelihood of technical debt and delivery delays.`
                        : " While you are operating within your theoretical limits, there remains a need to review low-priority initiatives ensuring resources are perfectly aligned with strategic value."}
                    {"\n\n"}
                    This assessment uncovers the tangible operational weight of your active initiatives and provides clear, actionable scenarios to either correct structural deficits or optimize existing capacity allocation.
                </Text>

                <Footer orgName={organizationName} date={dateStr} />
            </Page>

            {/* Main Baseline & Portfolio Pages */}
            <Page size="A4" style={styles.page} wrap>
                <Text style={styles.header}>Section 1: Your Capacity Baseline</Text>
                <Text style={styles.bodyText}>
                    A Strategic Capacity Baseline is the maximum volume of concurrent strategic initiatives an organisation can sustain before rigorous delivery discipline collapses into reactive firefighting.
                </Text>
                <Text style={styles.bodyText}>
                    Based on historical throughput rates for public sector operations of your scope, {organizationName}'s Baseline Capacity limit is established at:
                </Text>

                <View style={{ padding: 20, backgroundColor: Colors.LightGrey, marginVertical: 15, alignSelf: 'flex-start' }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.Navy }}>
                        {baselineSlots} Total Focus Slots
                    </Text>
                </View>

                <Text style={styles.header}>Section 2: Your Current Portfolio Load</Text>
                <Text style={styles.bodyText}>
                    The chart below visualises the true operational weight of your active initiatives. Each unit represents a 'Focus Slot', derived from Stakeholder Friction, Technological Novelty, and Dependency Depth.
                </Text>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 20, backgroundColor: Colors.LightGrey, padding: 20, borderRadius: 5 }}>
                    <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: Colors.Grey }}>
                        <Text style={{ fontSize: 10, color: Colors.Grey, marginBottom: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>Baseline Capacity Limit</Text>
                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: Colors.Navy }}>{baselineSlots}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                        <Text style={{ fontSize: 10, color: Colors.Grey, marginBottom: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>Current Portfolio Load</Text>
                        <Text style={{ fontSize: 36, fontWeight: 'bold', color: statusColor }}>{totalLoad}</Text>
                    </View>
                </View>

                <View style={styles.chartContainer}>
                    <View style={{ height: 20, position: 'relative', marginBottom: 5 }}>
                        <View style={[styles.baselineMarker, { left: 150 + ((baselineSlots / maxBarValue) * 300) }]} />
                        <Text style={[styles.baselineText, { left: 150 + ((baselineSlots / maxBarValue) * 300) - 20 }]}>
                            BASELINE ({baselineSlots})
                        </Text>
                    </View>

                    {/* Render a cumulative stacked calculation to show overcommitment visually */}
                    <View style={[styles.chartBarWrapper, { marginTop: 15, marginBottom: 25 }]}>
                        <Text style={[styles.chartLabel, { fontWeight: 'bold' }]}>Cumulative Load</Text>
                        <View style={[styles.chartBarContainer, { backgroundColor: Colors.LightGrey, width: 300, flex: 'none' }]}>
                            <View style={[
                                styles.chartBarFill,
                                {
                                    width: `${Math.min((totalLoad / maxBarValue) * 100, 100)}%`,
                                    backgroundColor: statusColor
                                }
                            ]} />
                            <View style={[styles.baselineMarker, { left: `${(Math.min(baselineSlots, maxBarValue) / maxBarValue) * 100}%`, backgroundColor: Colors.Charcoal }]} />
                        </View>
                        <Text style={[styles.chartValue, { color: statusColor }]}>{totalLoad}</Text>
                    </View>

                    <Text style={[styles.subHeader, { fontSize: 11, marginBottom: 15 }]}>Initiative Breakdown Table (Sorted by Highest Priority)</Text>

                    {sortedInitiatives.map((init, idx) => {
                        let pct = (init.cost / maxBarValue) * 100;
                        let barColor = Colors.Navy;
                        if (init.cost >= 5) barColor = Colors.Red;
                        else if (init.cost >= 3) barColor = Colors.Amber;
                        else barColor = Colors.Grey;

                        return (
                            <View key={idx} style={styles.chartBarWrapper} wrap={false}>
                                <Text style={styles.chartLabel}>
                                    {init.name.substring(0, 30)}{init.name.length > 30 ? '...' : ''}
                                </Text>
                                <View style={[styles.chartBarContainer, { width: 300, flex: 'none', backgroundColor: 'transparent' }]}>
                                    <View style={[styles.chartBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                                </View>
                                <Text style={styles.chartValue}>{init.cost} S</Text>
                            </View>
                        );
                    })}
                </View>

                <Footer orgName={organizationName} date={dateStr} />
            </Page>

            <Page size="A4" style={styles.page} wrap>
                <Text style={styles.header}>Section 3: Where Your Strategy is Exposed</Text>
                <View>{renderParagraphs(analysis.section3)}</View>

                <Text style={styles.header}>Section 4: Trade-Off Scenarios</Text>
                <View>{renderParagraphs(analysis.section4)}</View>

                <Footer orgName={organizationName} date={dateStr} />
            </Page>

            {/* Next Steps and Methodology */}
            <Page size="A4" style={styles.page} wrap>
                <Text style={styles.header}>Section 5: Recommended Next Steps</Text>

                <Text style={styles.bodyText}>
                    Defensible governance requires action on these findings. Proceed with one of the following strategic pathways:
                </Text>
                <View style={styles.optionsList}>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>1.</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Independent Rationalisation.</Text> Use the data provided in Scenario B to independently halt or pause the identified low-value initiatives, bringing your portfolio back within Baseline constraints.
                        </Text>
                    </View>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>2.</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Implement Enterprise Guardrails.</Text> Establish ongoing governance to permanently lock in the {analysis.recoveredSlots || "calculated"} slots of capacity recovered/reassigned in Scenario B and re-allocate the {formattedFiscalDrag} currently lost to drift.
                        </Text>
                    </View>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>3.</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Deep-Dive Follow-Up.</Text> Schedule a tailored, executive-level workshop to interrogate these figures and formally sign off on the required portfolio trade-offs.
                        </Text>
                    </View>
                </View>

                <Text style={[styles.header, { marginTop: 40 }]}>Appendix: Methodology Note</Text>
                <Text style={styles.bodyText}>
                    The AlturaGov Strategic Capacity Methodology rests on the "Physics of Focus" framework. To establish a quantifiable measure of delivery drag, we calculate an initiative's "Focus Slots." Instead of relying on abstract budget or FTE metrics that obscure real cognitive load, the complexity of any given strategic initiative is calculated across three fixed scalar factors:
                </Text>
                <View style={styles.optionsList}>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>•</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Stakeholder Friction:</Text> Measures alignment difficulty. Single-department BAU requires low friction (1), whereas cross-departmental or Ministerial priorities mandate dense coordination (3-5).
                        </Text>
                    </View>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>•</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Novelty {'&'} Tech:</Text> Accounts for execution variance. Known patterns score low (1), while first-of-kind innovations or legacy integrations drastically increase load limits (5).
                        </Text>
                    </View>
                    <View style={styles.optionItem}>
                        <Text style={styles.optionBullet}>•</Text>
                        <Text style={styles.optionText}>
                            <Text style={styles.boldText}>Dependency Depth:</Text> Identifies process blockers. Independent workstreams rate low (1), while critical-path blockers carry maximum weight (5).
                        </Text>
                    </View>
                </View>

                <Footer orgName={organizationName} date={dateStr} />
            </Page>
        </Document >
    );
};

export const generatePdfBuffer = async (data: ReportData): Promise<Buffer> => {
    // Generate the PDF stream/buffer via React-PDF
    const pdfStream = await renderToBuffer(<AuditDocument data={data} />);
    return pdfStream;
};
