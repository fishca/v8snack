// Диагностика (tools/ADAPT.md, форма): какие из описанных интерфейсов поддерживает объект (QueryInterface). Сгенерировано из v8api/*.v
#pragma once
#include "../all.h"

string probeIfaces(IUnknown&& o) {
    string r;
    if (o is null)
        return "null";
    { IAppExitCancel&& p = o.unk; if (p !is null) r += "IAppExitCancel "; }
    { IAssistList&& p = o.unk; if (p !is null) r += "IAssistList "; }
    { IAssistListInfo&& p = o.unk; if (p !is null) r += "IAssistListInfo "; }
    { IAssistantData&& p = o.unk; if (p !is null) r += "IAssistantData "; }
    { ICalcValueCreator&& p = o.unk; if (p !is null) r += "ICalcValueCreator "; }
    { IClientSite&& p = o.unk; if (p !is null) r += "IClientSite "; }
    { ICmdDescription&& p = o.unk; if (p !is null) r += "ICmdDescription "; }
    { ICmdStateImpl&& p = o.unk; if (p !is null) r += "ICmdStateImpl "; }
    { ICommandReceiver&& p = o.unk; if (p !is null) r += "ICommandReceiver "; }
    { ICommandState&& p = o.unk; if (p !is null) r += "ICommandState "; }
    { ICommandTarget&& p = o.unk; if (p !is null) r += "ICommandTarget "; }
    { IConfigMngr&& p = o.unk; if (p !is null) r += "IConfigMngr "; }
    { IConfigMngrUI&& p = o.unk; if (p !is null) r += "IConfigMngrUI "; }
    { IConfigMngrUIOwner&& p = o.unk; if (p !is null) r += "IConfigMngrUIOwner "; }
    { IContainedObject&& p = o.unk; if (p !is null) r += "IContainedObject "; }
    { IContainer&& p = o.unk; if (p !is null) r += "IContainer "; }
    { IContext&& p = o.unk; if (p !is null) r += "IContext "; }
    { IContextDef&& p = o.unk; if (p !is null) r += "IContextDef "; }
    { IContextDefExt&& p = o.unk; if (p !is null) r += "IContextDefExt "; }
    { IControlContext&& p = o.unk; if (p !is null) r += "IControlContext "; }
    { IControlDesign&& p = o.unk; if (p !is null) r += "IControlDesign "; }
    { ICopyHelperCreator&& p = o.unk; if (p !is null) r += "ICopyHelperCreator "; }
    { ICtx2Disp&& p = o.unk; if (p !is null) r += "ICtx2Disp "; }
    { ICustomForm&& p = o.unk; if (p !is null) r += "ICustomForm "; }
    { ICustomFormDesigner&& p = o.unk; if (p !is null) r += "ICustomFormDesigner "; }
    { ICustomFormLoader&& p = o.unk; if (p !is null) r += "ICustomFormLoader "; }
    { IDataControl&& p = o.unk; if (p !is null) r += "IDataControl "; }
    { IDataControlEx&& p = o.unk; if (p !is null) r += "IDataControlEx "; }
    { IDataProviderInfo&& p = o.unk; if (p !is null) r += "IDataProviderInfo "; }
    { IDebugger&& p = o.unk; if (p !is null) r += "IDebugger "; }
    { IDocument&& p = o.unk; if (p !is null) r += "IDocument "; }
    { IDocumentFactory&& p = o.unk; if (p !is null) r += "IDocumentFactory "; }
    { IDocumentSink&& p = o.unk; if (p !is null) r += "IDocumentSink "; }
    { IDocumentView&& p = o.unk; if (p !is null) r += "IDocumentView "; }
    { IEdit&& p = o.unk; if (p !is null) r += "IEdit "; }
    { IEnumValCreator&& p = o.unk; if (p !is null) r += "IEnumValCreator "; }
    { IEventRecipient&& p = o.unk; if (p !is null) r += "IEventRecipient "; }
    { IExecutionStateMediumInStream&& p = o.unk; if (p !is null) r += "IExecutionStateMediumInStream "; }
    { IExternalCalculatorDebugger&& p = o.unk; if (p !is null) r += "IExternalCalculatorDebugger "; }
    { IExternalCalculatorOwner&& p = o.unk; if (p !is null) r += "IExternalCalculatorOwner "; }
    { IFile&& p = o.unk; if (p !is null) r += "IFile "; }
    { IFileEx&& p = o.unk; if (p !is null) r += "IFileEx "; }
    { IFileSystem&& p = o.unk; if (p !is null) r += "IFileSystem "; }
    { IFldEdit&& p = o.unk; if (p !is null) r += "IFldEdit "; }
    { IForm&& p = o.unk; if (p !is null) r += "IForm "; }
    { IFormCtrl&& p = o.unk; if (p !is null) r += "IFormCtrl "; }
    { IFormDialog&& p = o.unk; if (p !is null) r += "IFormDialog "; }
    { IFormViewCore&& p = o.unk; if (p !is null) r += "IFormViewCore "; }
    { IFramedView&& p = o.unk; if (p !is null) r += "IFramedView "; }
    { IFramedViewSite&& p = o.unk; if (p !is null) r += "IFramedViewSite "; }
    { IGlobalContext&& p = o.unk; if (p !is null) r += "IGlobalContext "; }
    { IGlobalContextInit&& p = o.unk; if (p !is null) r += "IGlobalContextInit "; }
    { IGlyph&& p = o.unk; if (p !is null) r += "IGlyph "; }
    { IGrid&& p = o.unk; if (p !is null) r += "IGrid "; }
    { IGridUISource&& p = o.unk; if (p !is null) r += "IGridUISource "; }
    { IIdleHandler&& p = o.unk; if (p !is null) r += "IIdleHandler "; }
    { IIdleService&& p = o.unk; if (p !is null) r += "IIdleService "; }
    { IImage&& p = o.unk; if (p !is null) r += "IImage "; }
    { IInPersistenceStorage&& p = o.unk; if (p !is null) r += "IInPersistenceStorage "; }
    { IIndexedCollectionFS&& p = o.unk; if (p !is null) r += "IIndexedCollectionFS "; }
    { IIndexedCollectionRO&& p = o.unk; if (p !is null) r += "IIndexedCollectionRO "; }
    { IInfoBase&& p = o.unk; if (p !is null) r += "IInfoBase "; }
    { ILangSettings&& p = o.unk; if (p !is null) r += "ILangSettings "; }
    { IListCmdState&& p = o.unk; if (p !is null) r += "IListCmdState "; }
    { ILocalString&& p = o.unk; if (p !is null) r += "ILocalString "; }
    { IMDBaseObj&& p = o.unk; if (p !is null) r += "IMDBaseObj "; }
    { IMDClass&& p = o.unk; if (p !is null) r += "IMDClass "; }
    { IMDContainer&& p = o.unk; if (p !is null) r += "IMDContainer "; }
    { IMDEditHelper&& p = o.unk; if (p !is null) r += "IMDEditHelper "; }
    { IMDEditModuleHelper&& p = o.unk; if (p !is null) r += "IMDEditModuleHelper "; }
    { IMDExtObj&& p = o.unk; if (p !is null) r += "IMDExtObj "; }
    { IMDIClient&& p = o.unk; if (p !is null) r += "IMDIClient "; }
    { IMDObject&& p = o.unk; if (p !is null) r += "IMDObject "; }
    { IMDParentLink&& p = o.unk; if (p !is null) r += "IMDParentLink "; }
    { IMDTypedObj&& p = o.unk; if (p !is null) r += "IMDTypedObj "; }
    { IModuleEdit&& p = o.unk; if (p !is null) r += "IModuleEdit "; }
    { IOutPersistenceStorage&& p = o.unk; if (p !is null) r += "IOutPersistenceStorage "; }
    { IOutlineCoords&& p = o.unk; if (p !is null) r += "IOutlineCoords "; }
    { IPersistableDocument&& p = o.unk; if (p !is null) r += "IPersistableDocument "; }
    { IPersistableObject&& p = o.unk; if (p !is null) r += "IPersistableObject "; }
    { IProfileFolder&& p = o.unk; if (p !is null) r += "IProfileFolder "; }
    { IProfileSource&& p = o.unk; if (p !is null) r += "IProfileSource "; }
    { IRuntimeModule&& p = o.unk; if (p !is null) r += "IRuntimeModule "; }
    { ISettingsConsumer&& p = o.unk; if (p !is null) r += "ISettingsConsumer "; }
    { ISourceLexer&& p = o.unk; if (p !is null) r += "ISourceLexer "; }
    { IStorageRW&& p = o.unk; if (p !is null) r += "IStorageRW "; }
    { IStreamPersistenceStorage&& p = o.unk; if (p !is null) r += "IStreamPersistenceStorage "; }
    { ITEIntelliSence&& p = o.unk; if (p !is null) r += "ITEIntelliSence "; }
    { ITabbedLayouter&& p = o.unk; if (p !is null) r += "ITabbedLayouter "; }
    { ITempFile&& p = o.unk; if (p !is null) r += "ITempFile "; }
    { ITemplateProcessor&& p = o.unk; if (p !is null) r += "ITemplateProcessor "; }
    { ITextEditor&& p = o.unk; if (p !is null) r += "ITextEditor "; }
    { ITextExtBackColors&& p = o.unk; if (p !is null) r += "ITextExtBackColors "; }
    { ITextExtColors&& p = o.unk; if (p !is null) r += "ITextExtColors "; }
    { ITextExtention&& p = o.unk; if (p !is null) r += "ITextExtention "; }
    { ITextManager&& p = o.unk; if (p !is null) r += "ITextManager "; }
    { ITextManager_Operations&& p = o.unk; if (p !is null) r += "ITextManager_Operations "; }
    { ITextParserCache&& p = o.unk; if (p !is null) r += "ITextParserCache "; }
    { ITopLevelFrame&& p = o.unk; if (p !is null) r += "ITopLevelFrame "; }
    { ITopLevelFrameCore&& p = o.unk; if (p !is null) r += "ITopLevelFrameCore "; }
    { ITxtEdtExtender&& p = o.unk; if (p !is null) r += "ITxtEdtExtender "; }
    { ITxtEdtOptions&& p = o.unk; if (p !is null) r += "ITxtEdtOptions "; }
    { IType&& p = o.unk; if (p !is null) r += "IType "; }
    { ITypeContextInfo&& p = o.unk; if (p !is null) r += "ITypeContextInfo "; }
    { ITypeNameInfo&& p = o.unk; if (p !is null) r += "ITypeNameInfo "; }
    { ITypesInfoProvider&& p = o.unk; if (p !is null) r += "ITypesInfoProvider "; }
    { IUnpackFile&& p = o.unk; if (p !is null) r += "IUnpackFile "; }
    { IV8Bookmark&& p = o.unk; if (p !is null) r += "IV8Bookmark "; }
    { IV8Color&& p = o.unk; if (p !is null) r += "IV8Color "; }
    { IV8DataSource&& p = o.unk; if (p !is null) r += "IV8DataSource "; }
    { IV8Picture&& p = o.unk; if (p !is null) r += "IV8Picture "; }
    { IV8PictureValue&& p = o.unk; if (p !is null) r += "IV8PictureValue "; }
    { IVTColumn&& p = o.unk; if (p !is null) r += "IVTColumn "; }
    { IVTColumnRO&& p = o.unk; if (p !is null) r += "IVTColumnRO "; }
    { IVTRow&& p = o.unk; if (p !is null) r += "IVTRow "; }
    { IVTRowRO&& p = o.unk; if (p !is null) r += "IVTRowRO "; }
    { IValue&& p = o.unk; if (p !is null) r += "IValue "; }
    { IValueArray&& p = o.unk; if (p !is null) r += "IValueArray "; }
    { IValueStructure&& p = o.unk; if (p !is null) r += "IValueStructure "; }
    { IValueSubTree&& p = o.unk; if (p !is null) r += "IValueSubTree "; }
    { IValueTable&& p = o.unk; if (p !is null) r += "IValueTable "; }
    { IValueTableBase&& p = o.unk; if (p !is null) r += "IValueTableBase "; }
    { IValueTableBaseRO&& p = o.unk; if (p !is null) r += "IValueTableBaseRO "; }
    { IValueTableColumns&& p = o.unk; if (p !is null) r += "IValueTableColumns "; }
    { IValueTree&& p = o.unk; if (p !is null) r += "IValueTree "; }
    { IValueTreeRow&& p = o.unk; if (p !is null) r += "IValueTreeRow "; }
    { IView&& p = o.unk; if (p !is null) r += "IView "; }
    { IViewContext&& p = o.unk; if (p !is null) r += "IViewContext "; }
    { IViewLayouter&& p = o.unk; if (p !is null) r += "IViewLayouter "; }
    { IViewSplitter&& p = o.unk; if (p !is null) r += "IViewSplitter "; }
    { IWindow&& p = o.unk; if (p !is null) r += "IWindow "; }
    { IWindowView&& p = o.unk; if (p !is null) r += "IWindowView "; }
    return r;
}
